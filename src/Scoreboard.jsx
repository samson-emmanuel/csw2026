import { useCallback, useEffect, useState } from 'react'
import { db } from './Gratitude.jsx'

// Columns s1..s4 map to these teams (same colours as The Teams page)
export const SB_TEAMS = [
  { k: 's1', name: 'Trailblazers', c: '#d62d1f', ic: '🔥' },
  { k: 's2', name: 'Pathfinders', c: '#073485', ic: '🧭' },
  { k: 's3', name: 'Roadrunners', c: '#e09a00', ic: '⚡' },
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

export function useGames() {
  const [games, setGames] = useState([])
  const load = useCallback(async () => {
    const { data } = await db.from('games').select('*').order('n')
    setGames(data || [])
  }, [])
  useEffect(() => {
    if (!db) return
    load()
    const ch = db.channel('games').on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, load).subscribe()
    return () => { db.removeChannel(ch) }
  }, [load])
  return [games, load]
}

// Totals per team, ranked (ties share a position)
function standings(games) {
  const rows = SB_TEAMS.map((t) => ({ ...t, total: games.reduce((a, g) => a + (Number(g[t.k]) || 0), 0) }))
    .sort((a, b) => b.total - a.total)
  rows.forEach((r, i) => { r.pos = i && r.total === rows[i - 1].total ? rows[i - 1].pos : i })
  return rows
}

function todayTab() {
  const wat = new Date(Date.now() + 3600000).toISOString().slice(0, 10) // date in WAT
  const i = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'].indexOf(wat)
  return i >= 0 ? SB_DAYS[i][0] : Date.now() > EVENT_END ? 'Overall' : 'Day 1'
}

export function Scoreboard() {
  const [games] = useGames()
  const [tab, setTab] = useState(todayTab)
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 2000); return () => clearInterval(i) }, [])

  if (!db) return <section className="wrap"><div className="gw-empty">The scoreboard isn’t connected yet.</div></section>

  const overall = tab === 'Overall'
  const list = overall ? games : games.filter((g) => g.day === tab)
  const table = standings(list)
  const max = Math.max(1, ...table.map((r) => r.total))
  const started = table.some((r) => r.total > 0) // no positions until the first points are in
  const played = list.filter((g) => SB_TEAMS.some((t) => g[t.k] !== null))
  const crowned = overall && now > EVENT_END && played.length > 0
  const fresh = (g) => now - new Date(g.updated_at).getTime() < 8000 && SB_TEAMS.some((t) => g[t.k] !== null)

  return (
    <>
      <section className="hero small">
        <p className="eyebrow"><span className="live-dot" /> Live Scoreboard</p>
        <h1>The <em>Race</em> Is On</h1>
        <p className="lead">Every game, every point, updated live. Which team will go the extra mile?</p>
      </section>

      <div className="snap-bar">
        <div className="snap-tabs">
          {SB_DAYS.map(([d, l]) => <button key={d} className={tab === d ? 'on' : ''} onClick={() => setTab(d)}>{d}<i>{l.split(' ')[0]}</i></button>)}
          <button className={`sb-overall ${overall ? 'on' : ''}`} onClick={() => setTab('Overall')}>🏆 Overall</button>
        </div>
      </div>

      <section className="wrap sb-wrap">
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
              <span className="sb-team"><i>{r.ic}</i>{r.name}{r.pos === 0 && r.total > 0 && <em>{overall ? 'Leading' : 'Day leader'}</em>}</span>
              <span className="sb-bar"><i style={{ width: `${(r.total / max) * 100}%` }} /></span>
              <span className="sb-total">{r.total}</span>
            </div>
          ))}
        </div>

        {!overall && (
          <div className="sb-table-wrap">
            <table className="sb-table">
              <thead>
                <tr><th>Game</th>{SB_TEAMS.map((t) => <th key={t.k} style={{ '--c': t.c }}><i>{t.ic}</i>{t.name}</th>)}</tr>
              </thead>
              <tbody>
                {list.map((g) => {
                  const done = SB_TEAMS.some((t) => g[t.k] !== null)
                  const top = done ? Math.max(...SB_TEAMS.map((t) => Number(g[t.k]) || 0)) : null
                  return (
                    <tr key={g.id} className={`${done ? '' : 'todo'} ${fresh(g) ? 'flash' : ''}`}>
                      <td>{g.name}</td>
                      {SB_TEAMS.map((t) => (
                        <td key={t.k} className={done && Number(g[t.k]) === top && top > 0 ? 'win' : ''} style={{ '--c': t.c }}>
                          {done ? (g[t.k] ?? '–') : <span className="sb-soon">Coming up</span>}
                        </td>
                      ))}
                    </tr>
                  )
                })}
                {!list.length && <tr><td colSpan={5} className="sb-none">No games scheduled for {tab} yet.</td></tr>}
              </tbody>
              <tfoot>
                <tr><td>Total</td>{SB_TEAMS.map((t) => <td key={t.k} style={{ '--c': t.c }}>{table.find((r) => r.k === t.k).total}</td>)}</tr>
              </tfoot>
            </table>
          </div>
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

// Admin section: rename / score / add / remove games for a day
export function ScoreAdmin({ code }) {
  const [games, reload] = useGames()
  const [day, setDay] = useState(todayTab() === 'Overall' ? 'Day 1' : todayTab())
  const [edit, setEdit] = useState({})
  const [msg, setMsg] = useState('')
  const list = games.filter((g) => g.day === day)
  const val = (g, k) => (edit[g.id]?.[k] ?? g[k] ?? '')
  const set = (g, k, v) => setEdit((e) => ({ ...e, [g.id]: { ...e[g.id], [k]: v } }))
  const num = (v) => (v === '' || v === null ? null : Number(v))

  const save = async (g) => {
    const { error } = await db.rpc('admin_save_game', { p_admin: code, p_id: g.id, p_name: val(g, 'name') || g.name, p_s1: num(val(g, 's1')), p_s2: num(val(g, 's2')), p_s3: num(val(g, 's3')), p_s4: num(val(g, 's4')) })
    if (error) return setMsg(error.message)
    setEdit((e) => { const n = { ...e }; delete n[g.id]; return n }); setMsg(`Saved “${val(g, 'name') || g.name}” — live now.`); reload()
  }
  const clear = async (g) => { await db.rpc('admin_save_game', { p_admin: code, p_id: g.id, p_name: g.name, p_s1: null, p_s2: null, p_s3: null, p_s4: null }); reload() }
  const remove = async (g) => { if (!confirm(`Remove “${g.name}” from ${day}?`)) return; await db.rpc('admin_delete_game', { p_admin: code, p_id: g.id }); reload() }
  const add = async () => { const { error } = await db.rpc('admin_add_game', { p_admin: code, p_day: day, p_name: '' }); if (error) setMsg(error.message); reload() }

  return (
    <div className="sb-admin">
      <div className="up-days">{SB_DAYS.map(([d]) => <button key={d} type="button" className={day === d ? 'on' : ''} onClick={() => setDay(d)}>{d}</button>)}</div>
      <div className="sb-admin-head"><span>Game</span>{SB_TEAMS.map((t) => <span key={t.k} style={{ color: t.c }}>{t.ic} {t.name}</span>)}<span /></div>
      {list.map((g) => (
        <form key={g.id} className={`sb-admin-row ${edit[g.id] ? 'dirty' : ''}`} onSubmit={(e) => { e.preventDefault(); save(g) }}>
          <input value={val(g, 'name')} onChange={(e) => set(g, 'name', e.target.value)} aria-label="Game name" />
          {SB_TEAMS.map((t) => <input key={t.k} type="number" inputMode="decimal" value={val(g, t.k)} onChange={(e) => set(g, t.k, e.target.value)} aria-label={`${t.name} score`} placeholder="–" />)}
          <div className="sb-admin-act">
            <button type="submit">Save</button>
            <button type="button" onClick={() => clear(g)}>Clear</button>
            <button type="button" onClick={() => remove(g)}>✕</button>
          </div>
        </form>
      ))}
      <button className="sb-add" onClick={add}>+ Add a game to {day}</button>
      {msg && <div className="admin-msg">{msg}</div>}
    </div>
  )
}
