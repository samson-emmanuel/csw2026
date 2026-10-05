import { useCallback, useEffect, useState } from 'react'
import { db } from './Gratitude.jsx'
import { unlockAudio, useCountdownSounds } from './sounds.js'

// Columns s1..s4 map to these teams (same colours as The Teams page)
export const SB_TEAMS = [
  { k: 's1', name: 'Trailblazers', c: '#d62d1f', ic: '🔥' },
  { k: 's2', name: 'Pathfinders', c: '#073485', ic: '🧭' },
  { k: 's3', name: 'Pacesetters', c: '#e09a00', ic: '⚡' },
  { k: 's4', name: 'Milestones', c: '#0f6b3c', ic: '🚩' },
]
export const SB_DAYS = [
  ['Day 1', 'Mon 5 Oct'], ['Day 2', 'Tue 6 Oct'], ['Day 3', 'Wed 7 Oct'],
  ['Day 4', 'Thu 8 Oct'], ['Day 5', 'Fri 9 Oct'], ['Day 6', 'Sat 10 Oct'],
]
// After this moment the Overall tab crowns the champions (Sat 10 Oct, 6pm WAT)
const EVENT_END = new Date('2026-10-10T18:00:00+01:00').getTime()
const ORD = ['1st', '2nd', '3rd', '4th']
const MEDAL = ['🥇', '🥈', '🥉', '']
const has = (r) => SB_TEAMS.some((t) => r[t.k] !== null && r[t.k] !== undefined)

// Games with their rounds attached; a game's score per team = sum of its rounds
export function useGames() {
  const [games, setGames] = useState([])
  const load = useCallback(async () => {
    const [{ data: g }, { data: r }] = await Promise.all([
      db.from('games').select('*').order('n'),
      db.from('rounds').select('*').order('n'),
    ])
    setGames((g || []).map((game) => {
      const rounds = (r || []).filter((x) => x.game_id === game.id)
      const tot = Object.fromEntries(SB_TEAMS.map((t) => [t.k, rounds.reduce((a, x) => a + (Number(x[t.k]) || 0), 0)]))
      const last = [game.updated_at, ...rounds.map((x) => x.updated_at)].sort().pop()
      return { ...game, rounds, tot, played: rounds.some(has), last }
    }))
  }, [])
  useEffect(() => {
    if (!db) return
    load()
    const ch = db.channel('scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, load)
      .subscribe()
    return () => { db.removeChannel(ch) }
  }, [load])
  return [games, load]
}

// Shared "team up + 60s timer" state; left = seconds remaining (null when not running)
export function useLive() {
  const [live, setLive] = useState(null)
  const [skew, setSkew] = useState(0)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!db) return
    const load = () => db.from('live_state').select('*').eq('id', 1).maybeSingle().then(({ data }) => setLive(data))
    // Offset between this device's clock and the server's (device clocks can be off by many seconds)
    const sync = async () => {
      const t0 = Date.now()
      const { data } = await db.rpc('server_now')
      if (data) setSkew(new Date(data).getTime() - (t0 + Date.now()) / 2)
    }
    load(); sync()
    const s = setInterval(sync, 60000)
    const ch = db.channel('live').on('postgres_changes', { event: '*', schema: 'public', table: 'live_state' }, load).subscribe()
    const i = setInterval(() => setNow(Date.now()), 100)
    return () => { db.removeChannel(ch); clearInterval(i); clearInterval(s) }
  }, [])
  const team = SB_TEAMS.find((t) => t.k === live?.team) || null
  const total = live?.seconds || 60
  const left = live?.started_at ? Math.min(total, Math.max(0, Math.ceil(total - (now + skew - new Date(live.started_at).getTime()) / 1000))) : null
  const exact = live?.started_at ? Math.max(0, total - (now + skew - new Date(live.started_at).getTime()) / 1000) : null
  return { team, left, total, exact }
}

function NowPlaying() {
  const { team, left, total, exact } = useLive()
  // Sound is on by default (viewers can mute); browsers need one tap/click on the page before audio can play
  const [sound, setSound] = useState(() => { try { return localStorage.getItem('sb-sound') !== '0' } catch { return true } })
  useEffect(() => {
    const go = () => unlockAudio()
    window.addEventListener('pointerdown', go, { once: true }); window.addEventListener('keydown', go, { once: true })
    return () => { window.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go) }
  }, [])
  const ringing = useCountdownSounds(left, sound, exact)
  const toggle = () => { if (!sound) unlockAudio(); setSound(!sound); try { localStorage.setItem('sb-sound', sound ? '0' : '1') } catch { /* private mode */ } }
  if (!team) return null
  const up = left === 0
  return (
    <div className={`np ${left !== null && left <= 10 && !up ? 'hurry' : ''}`} style={{ '--c': team.c, '--p': left === null ? 100 : (left / total) * 100 }}>
      <div className="np-team"><small>{left === null ? 'Up next' : up ? 'Time’s up' : 'Now playing'}</small><b><i>{team.ic}</i>{team.name}</b></div>
      <div className="np-clock">{left === null ? <span>Get ready…</span> : up ? (ringing ? <span className="bell">🔔</span> : <span>⏰ 0</span>) : <><b>{left}</b><small>sec</small></>}</div>
      <div className="np-bar"><i /></div>
      <button className="np-sound" onClick={toggle} title={sound ? 'Sound on' : 'Sound off'}>{sound ? '🔊' : '🔇'}</button>
    </div>
  )
}

// Totals per team, ranked (ties share a position)
function standings(games) {
  const rows = SB_TEAMS.map((t) => ({ ...t, total: games.reduce((a, g) => a + g.tot[t.k], 0) }))
    .sort((a, b) => b.total - a.total)
  rows.forEach((r, i) => { r.pos = i && r.total === rows[i - 1].total ? rows[i - 1].pos : i })
  return rows
}

export function todayTab() {
  const wat = new Date(Date.now() + 3600000).toISOString().slice(0, 10) // date in WAT
  const i = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'].indexOf(wat)
  return i >= 0 ? SB_DAYS[i][0] : Date.now() > EVENT_END ? 'Overall' : 'Day 1'
}

export function Scoreboard() {
  const [games] = useGames()
  const [tab, setTab] = useState(todayTab)
  const [openG, setOpenG] = useState({})
  const [showAll, setShowAll] = useState(() => { try { return localStorage.getItem('sb-all') === '1' } catch { return false } })
  const toggleAll = () => setShowAll((v) => {
    setOpenG({}) // switching either way resets any games opened by tapping
    try { localStorage.setItem('sb-all', v ? '0' : '1') } catch { /* private mode */ }
    return !v
  })
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 2000); return () => clearInterval(i) }, [])

  if (!db) return <section className="wrap"><div className="gw-empty">The scoreboard isn’t connected yet.</div></section>

  const overall = tab === 'Overall'
  const list = overall ? games : games.filter((g) => g.day === tab)
  const table = standings(list)
  const max = Math.max(1, ...table.map((r) => r.total))
  const started = table.some((r) => r.total > 0) // no positions until the first points are in
  const crowned = overall && now > EVENT_END && started
  const fresh = (g) => g.played && now - new Date(g.last).getTime() < 8000

  return (
    <>
      <section className="hero small">
        <p className="eyebrow"><span className="live-dot" /> Live Scoreboard</p>
        <h1>The <em>Race</em> Is On</h1>
        <p className="lead">Every game, every round, every point, updated live. Which team will go the extra mile?</p>
      </section>

      <div className="snap-bar">
        <div className="snap-tabs">
          {SB_DAYS.map(([d, l]) => <button key={d} className={tab === d ? 'on' : ''} onClick={() => setTab(d)}>{d}<i>{l.split(' ')[0]}</i></button>)}
          <button className={`sb-overall ${overall ? 'on' : ''}`} onClick={() => setTab('Overall')}>🏆 Overall</button>
        </div>
      </div>

      <section className="wrap sb-wrap">
        <NowPlaying />
        {crowned && (
          <div className="sb-champ" style={{ '--c': table[0].c }}>
            <span>🏆</span>
            <div><small>CSW 2026 Overall Champions</small><b>{table.filter((r) => r.pos === 0).map((r) => r.name).join(' & ')}</b><em>{table[0].total} points</em></div>
          </div>
        )}

        <div className="sb-board">
          <h3>{overall ? (crowned ? 'Final standings' : 'Overall standings · all days') : `${tab} standings`}</h3>
          {table.map((r) => (
            <div key={r.k} className={`sb-row ${started ? `p${r.pos}` : ''}`} style={{ '--c': r.c }}>
              <span className="sb-pos">{started ? <>{MEDAL[r.pos]}<b>{ORD[r.pos]}</b></> : <b>–</b>}</span>
              <span className="sb-team"><i>{r.ic}</i>{r.name}{started && r.pos === 0 && <em>{overall ? 'Leading' : 'Day leader'}</em>}</span>
              <span className="sb-bar"><i style={{ width: `${(r.total / max) * 100}%` }} /></span>
              <span className="sb-total">{r.total}</span>
            </div>
          ))}
        </div>

        {!overall && (
          <>
          <label className="sb-switch"><input type="checkbox" checked={showAll} onChange={toggleAll} /><span />Show all rounds</label>
          <div className="sb-table-wrap">
            <table className="sb-table">
              <thead>
                <tr><th>Game</th>{SB_TEAMS.map((t) => <th key={t.k} style={{ '--c': t.c }}><i>{t.ic}</i>{t.name}</th>)}</tr>
              </thead>
              <tbody>
                {list.map((g) => {
                  const top = g.played ? Math.max(...SB_TEAMS.map((t) => g.tot[t.k])) : null
                  const multi = g.rounds.length > 1
                  const open = showAll ? g.rounds.length > 0 : multi && !!openG[g.id]
                  return [
                    <tr key={g.id} className={`${g.played ? '' : 'todo'} ${fresh(g) ? 'flash' : ''} ${multi ? 'has-rounds' : ''}`} onClick={() => multi && !showAll && setOpenG((o) => ({ ...o, [g.id]: !open }))}>
                      <td>{g.name}{(multi || showAll) && g.rounds.length > 0 && <span className="sb-rcount">{g.rounds.length} round{g.rounds.length === 1 ? '' : 's'}{multi && !showAll ? (open ? ' ▴' : ' ▾') : ''}</span>}</td>
                      {SB_TEAMS.map((t) => (
                        <td key={t.k} className={g.played && g.tot[t.k] === top && top > 0 ? 'win' : ''} style={{ '--c': t.c }}>
                          {g.played ? g.tot[t.k] : <span className="sb-soon">Coming up</span>}
                        </td>
                      ))}
                    </tr>,
                    ...(open ? g.rounds.map((r) => (
                      <tr key={r.id} className="sb-round">
                        <td>Round {r.n}</td>
                        {SB_TEAMS.map((t) => <td key={t.k}>{has(r) ? (r[t.k] ?? 0) : '–'}</td>)}
                      </tr>
                    )) : []),
                  ]
                })}
                {!list.length && <tr><td colSpan={5} className="sb-none">No games scheduled for {tab} yet.</td></tr>}
              </tbody>
              <tfoot>
                <tr><td>Total</td>{SB_TEAMS.map((t) => <td key={t.k} style={{ '--c': t.c }}>{table.find((r) => r.k === t.k).total}</td>)}</tr>
              </tfoot>
            </table>
          </div>
          </>
        )}

        {overall && (
          <div className="sb-days">
            {SB_DAYS.map(([d, l]) => {
              const s = standings(games.filter((g) => g.day === d))
              const any = s.some((r) => r.total > 0)
              return (
                <button key={d} className="sb-day" onClick={() => setTab(d)}>
                  <small>{d} · {l}</small>
                  {any ? <b style={{ color: s[0].c }}>{s[0].ic} {s.filter((r) => r.pos === 0).map((r) => r.name).join(' & ')}</b> : <b className="muted">Not played yet</b>}
                  {any && <span>{s.map((r) => `${r.name.slice(0, 5)}. ${r.total}`).join(' · ')}</span>}
                </button>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

// Admin: per day → games (rename / remove) → rounds (score / add / remove)
export function ScoreAdmin({ code }) {
  const [games, reload] = useGames()
  const [day, setDay] = useState(todayTab() === 'Overall' ? 'Day 1' : todayTab())
  const [names, setNames] = useState({})
  const [edit, setEdit] = useState({})
  const [msg, setMsg] = useState('')
  const list = games.filter((g) => g.day === day)
  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
  const rv = (r, k) => edit[r.id]?.[k] ?? r[k] ?? ''
  const setR = (r, k, v) => setEdit((e) => ({ ...e, [r.id]: { ...e[r.id], [k]: v } }))
  const run = async (fn, args, ok) => { const { error } = await db.rpc(fn, { p_admin: code, ...args }); if (error) setMsg(error.message); else if (ok) setMsg(ok); reload() }

  const saveName = (g) => run('admin_rename_game', { p_id: g.id, p_name: names[g.id] ?? g.name }, `Renamed to “${names[g.id] ?? g.name}”.`)
  const saveRound = async (g, r) => {
    await run('admin_save_round', { p_id: r.id, p_s1: num(rv(r, 's1')), p_s2: num(rv(r, 's2')), p_s3: num(rv(r, 's3')), p_s4: num(rv(r, 's4')) }, `${g.name} · Round ${r.n} saved — live now.`)
    setEdit((e) => { const n = { ...e }; delete n[r.id]; return n })
  }
  const delRound = (r) => { if (confirm(`Remove Round ${r.n}?`)) run('admin_delete_round', { p_id: r.id }) }
  const delGame = (g) => { if (confirm(`Remove “${g.name}” and all its rounds from ${day}?`)) run('admin_delete_game', { p_id: g.id }) }

  return (
    <div className="sb-admin">
      <div className="up-days">{SB_DAYS.map(([d]) => <button key={d} type="button" className={day === d ? 'on' : ''} onClick={() => setDay(d)}>{d}</button>)}</div>
      {list.map((g) => (
        <div key={g.id} className="sbg">
          <div className="sbg-head">
            <input value={names[g.id] ?? g.name} onChange={(e) => setNames((n) => ({ ...n, [g.id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && saveName(g)} aria-label="Game name" />
            {names[g.id] !== undefined && names[g.id] !== g.name && <button className="sbg-save" onClick={() => saveName(g)}>Save name</button>}
            <button className="sbg-del" onClick={() => delGame(g)} title="Remove game">✕</button>
          </div>
          {g.rounds.length > 0 && <div className="sbg-cols"><span>Round</span>{SB_TEAMS.map((t) => <span key={t.k} style={{ color: t.c }}>{t.ic} {t.name}</span>)}<span /></div>}
          {g.rounds.map((r) => (
            <form key={r.id} className={`sbg-round ${edit[r.id] ? 'dirty' : ''}`} onSubmit={(e) => { e.preventDefault(); saveRound(g, r) }}>
              <b>R{r.n}</b>
              {SB_TEAMS.map((t) => (
                <input key={t.k} type="number" inputMode="decimal" placeholder={t.name.slice(0, 4) + '…'} value={rv(r, t.k)} onChange={(e) => setR(r, t.k, e.target.value)} aria-label={`${t.name} round ${r.n}`} />
              ))}
              <div className="sbg-act"><button type="submit">Save</button><button type="button" onClick={() => delRound(r)}>✕</button></div>
            </form>
          ))}
          <div className="sbg-foot">
            <button className="sbg-add" onClick={() => run('admin_add_round', { p_game: g.id })}>+ Add round</button>
            <span>Total: {SB_TEAMS.map((t) => <b key={t.k} style={{ color: t.c }}>{g.tot[t.k]}</b>)}</span>
          </div>
        </div>
      ))}
      <button className="sb-add" onClick={() => run('admin_add_game', { p_day: day, p_name: '' })}>+ Add a game to {day}</button>
      {msg && <div className="admin-msg">{msg}</div>}
    </div>
  )
}
