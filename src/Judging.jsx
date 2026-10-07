import { useEffect, useState } from 'react'
import { db, store } from './Gratitude.jsx'
import { SB_DAYS, SB_TEAMS, todayTab, useGames } from './Scoreboard.jsx'

const JUDGES = ['Judge 1', 'Judge 2', 'Judge 3']
const num = (v) => { const t = String(v ?? '').trim(); const n = Number(t); return t === '' || Number.isNaN(n) ? null : n }

// Admin-only: enter 3 judges' scores per team; the total becomes that team's score for the round
export function Judging() {
  const [code] = useState(() => store.get('gw-admin'))
  const [ok, setOk] = useState(null)
  const [games, reload] = useGames()
  const [day, setDay] = useState(todayTab() === 'Overall' ? 'Day 1' : todayTab())
  const [gameId, setGameId] = useState('')
  const [roundId, setRoundId] = useState('')
  const [vals, setVals] = useState({}) // { s1: ['', '', ''], ... }
  const [saved, setSaved] = useState({})
  const [msg, setMsg] = useState('')

  useEffect(() => { if (db && code) db.rpc('is_admin', { p_admin: code }).then(({ data }) => setOk(!!data)); else setOk(false) }, [code])

  const dayGames = games.filter((g) => g.day === day)
  const game = dayGames.find((g) => g.id === gameId) || dayGames.find((g) => /karaoke/i.test(g.name)) || dayGames[0]
  const round = game?.rounds.find((r) => r.id === roundId) || game?.rounds[game.rounds.length - 1]

  // Load saved judge scores when the round changes
  useEffect(() => {
    if (!db || !round) return
    db.from('judge_scores').select('*').eq('round_id', round.id).then(({ data }) => {
      const v = {}
      SB_TEAMS.forEach((t) => { const r = (data || []).find((x) => x.team === t.k); v[t.k] = [r?.j1 ?? '', r?.j2 ?? '', r?.j3 ?? ''].map(String) })
      setVals(v); setSaved({})
    })
  }, [round?.id])

  if (ok === null) return <section className="wrap"><div className="gw-empty">Checking…</div></section>
  if (!ok) return <section className="wrap"><div className="gw-empty">Admins only — unlock the admin dashboard first (<a href="#/admin">#/admin</a>).</div></section>

  const total = (k) => { const a = (vals[k] || []).map(num); return a.every((x) => x === null) ? null : a.reduce((s, x) => s + (x || 0), 0) }
  const set = (k, i, v) => { setVals((o) => { const a = [...(o[k] || ['', '', ''])]; a[i] = v; return { ...o, [k]: a } }); setSaved((s) => ({ ...s, [k]: false })) }
  const save = async (t) => {
    const [j1, j2, j3] = (vals[t.k] || []).map(num)
    const { error } = await db.rpc('admin_save_judges', { p_admin: code, p_round: round.id, p_team: t.k, p_j1: j1, p_j2: j2, p_j3: j3 })
    if (error) return setMsg(error.message)
    setSaved((s) => ({ ...s, [t.k]: true })); setMsg(`${t.name}: ${total(t.k) ?? 0} points saved to ${game.name} · Round ${round.n} — live on the Scoreboard.`); reload()
  }
  const saveAll = async () => { for (const t of SB_TEAMS) await save(t) }
  const addRound = async () => { await db.rpc('admin_add_round', { p_admin: code, p_game: game.id }); setRoundId(''); reload() }

  return (
    <section className="wrap jd">
      <div className="jd-head">
        <div><p className="eyebrow">Admin · Judging</p><h2>Judges’ scores</h2></div>
        <a className="jd-link" href="#/scoreboard" target="_blank" rel="noreferrer">📺 Open scoreboard</a>
      </div>
      <div className="jd-pick">
        <select value={day} onChange={(e) => { setDay(e.target.value); setGameId(''); setRoundId('') }}>{SB_DAYS.map(([d]) => <option key={d}>{d}</option>)}</select>
        <select value={game?.id || ''} onChange={(e) => { setGameId(e.target.value); setRoundId('') }}>{dayGames.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <select value={round?.id || ''} onChange={(e) => setRoundId(e.target.value)}>{(game?.rounds || []).map((r) => <option key={r.id} value={r.id}>Round {r.n}</option>)}</select>
        {game && <button onClick={addRound}>+ Add round</button>}
      </div>
      {!game && <div className="gw-empty">No games on {day}. Add one (e.g. “Karaoke”) in Admin → Scores.</div>}
      {round && (
        <>
          <div className="jd-grid">
            {SB_TEAMS.map((t) => (
              <div key={t.k} className={`jd-card ${saved[t.k] ? 'ok' : ''}`} style={{ '--c': t.c }}>
                <h3><i>{t.ic}</i>{t.name}</h3>
                {JUDGES.map((j, i) => (
                  <label key={j}><span>{j}</span>
                    <input type="text" inputMode="text" value={vals[t.k]?.[i] ?? ''} onChange={(e) => set(t.k, i, e.target.value)} placeholder="–" />
                  </label>
                ))}
                <div className="jd-total"><span>Total</span><b>{total(t.k) ?? '–'}</b></div>
                <button onClick={() => save(t)}>{saved[t.k] ? '✓ Saved' : 'Save'}</button>
              </div>
            ))}
          </div>
          <button className="btn jd-all" onClick={saveAll}>Save all four teams</button>
        </>
      )}
      {msg && <div className="admin-msg">{msg}</div>}
    </section>
  )
}
