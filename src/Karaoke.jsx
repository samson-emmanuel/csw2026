import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { db } from './Gratitude.jsx'
import { SB_TEAMS, todayTab, useGames } from './Scoreboard.jsx'

// Number that counts up/down smoothly when it changes
function Count({ value }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = from.current, end = Number(value) || 0, t0 = performance.now()
    if (start === end) return
    let raf
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3)
      setShown(Math.round(start + (end - start) * e))
      if (k < 1) raf = requestAnimationFrame(step); else from.current = end
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{shown}</>
}

// Public live Karaoke board: judges' scores per team per round + Karaoke leaderboard
export function Karaoke() {
  const [games, reloadGames] = useGames()
  useEffect(() => { const t = setInterval(reloadGames, 5000); return () => clearInterval(t) }, [reloadGames]) // picks up new rounds even without live updates
  const [judges, setJudges] = useState(['Judge 1', 'Judge 2', 'Judge 3'])
  const [scores, setScores] = useState([])
  const [pick, setPick] = useState(null) // round id, or 'all'
  const prevTot = useRef(null)
  const [bumps, setBumps] = useState({}) // team -> { d: delta, n: key } to replay the animation

  // The board follows whichever game has judges' scores (prefer today's; a game named "Karaoke" wins ties)
  const [judged, setJudged] = useState([]) // round ids that have judge scores
  useEffect(() => {
    if (!db) return
    const load = () => db.from('judge_scores').select('round_id, updated_at').order('updated_at', { ascending: false }).then(({ data }) => setJudged((data || []).map((x) => x.round_id)))
    load()
    const ch = db.channel('judged').on('postgres_changes', { event: '*', schema: 'public', table: 'judge_scores' }, load).subscribe()
    const poll = setInterval(load, 5000) // backup in case live updates aren't enabled
    return () => { db.removeChannel(ch); clearInterval(poll) }
  }, [])
  const jGames = games.filter((g) => /karaoke/i.test(g.name) || g.rounds.some((r) => judged.includes(r.id)))
  const latestJudged = games.find((g) => g.rounds.some((r) => r.id === judged[0]))
  // Today's karaoke only (each day starts fresh); after the event, the last one judged
  const today = todayTab()
  const game = today === 'Overall'
    ? latestJudged || jGames[jGames.length - 1]
    : jGames.find((g) => g.day === today && /karaoke/i.test(g.name) && g.rounds.some((r) => judged.includes(r.id))) || jGames.find((g) => g.day === today && g.rounds.some((r) => judged.includes(r.id)))
  // Only rounds scored by the judges count here (ignores timer points in the same game)
  const rounds = (game?.rounds || []).filter((r) => judged.includes(r.id))
  // Round total = Judge 1 + Judge 2 + Judge 3 only (never the main scoreboard's round score)
  const jsum = (rid, k) => { const x = scores.find((y) => y.round_id === rid && y.team === k); if (!x || [x.j1, x.j2, x.j3].every((v) => v === null)) return null; return (Number(x.j1) || 0) + (Number(x.j2) || 0) + (Number(x.j3) || 0) }
  const ktot = Object.fromEntries(SB_TEAMS.map((t) => [t.k, rounds.reduce((a, r) => a + (jsum(r.id, t.k) || 0), 0)]))
  const ids = rounds.map((r) => r.id).join(',')

  useEffect(() => {
    if (!db || !ids) return
    const load = () => db.from('judge_scores').select('*').in('round_id', ids.split(',')).then(({ data }) => setScores(data || []))
    load()
    const ch = db.channel('judges').on('postgres_changes', { event: '*', schema: 'public', table: 'judge_scores' }, load).subscribe()
    const poll = setInterval(load, 5000) // backup in case live updates aren't enabled
    return () => { db.removeChannel(ch); clearInterval(poll) }
  }, [ids])

  // Detect score changes per team → flash + floating "+N"
  const totKey = game ? SB_TEAMS.map((t) => ktot[t.k]).join('|') : ''
  useEffect(() => {
    if (!game) return
    const now = Object.fromEntries(SB_TEAMS.map((t) => [t.k, ktot[t.k]]))
    const before = prevTot.current
    prevTot.current = now
    if (!before) return
    const b = {}
    SB_TEAMS.forEach((t) => { const d = now[t.k] - before[t.k]; if (d) b[t.k] = { d, n: Date.now() } })
    if (Object.keys(b).length) setBumps((o) => ({ ...o, ...b }))
  }, [totKey])

  // Fit the whole board on one screen: scale it down evenly (never up) when it's taller than the stage
  const stageRef = useRef(null), fitRef = useRef(null)
  useLayoutEffect(() => {
    const stage = stageRef.current, el = fitRef.current
    if (!stage || !el) return
    const fit = () => {
      el.style.transform = 'none'; el.style.width = '100%'
      const s = Math.min(1, stage.clientHeight / el.scrollHeight)
      el.style.transform = `scale(${s})`; el.style.width = `${100 / s}%`
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(stage)
    window.addEventListener('resize', fit)
    return () => { ro.disconnect(); window.removeEventListener('resize', fit) }
  })
  // Judge names for the day being shown
  const nameDay = game?.day || (today === 'Overall' ? null : today)
  useEffect(() => {
    if (!db || !nameDay) return
    const load = () => db.rpc('judge_names_for', { p_day: nameDay }).then(({ data }) => { if (data) setJudges(String(data).split('|')) })
    load()
    const t = setInterval(load, 5000) // names edited on the Judging page show here within 5s
    return () => clearInterval(t)
  }, [nameDay])
  if (!db) return null

  // Latest round that has any score is shown by default
  const scored = rounds.filter((r) => SB_TEAMS.some((t) => jsum(r.id, t.k) !== null))
  const cur = pick === 'all' ? 'all' : rounds.find((r) => r.id === pick) || scored[scored.length - 1] || rounds[0]
  const board = SB_TEAMS.map((t) => ({ ...t, total: ktot[t.k] })).sort((a, b) => b.total - a.total)
  board.forEach((r, i) => { r.pos = i && r.total === board[i - 1].total ? board[i - 1].pos : i })
  const started = board.some((r) => r.total > 0)
  const MEDAL = ['🥇', '🥈', '🥉', '4th']

  return (
    <div className="ka-stage" ref={stageRef}>
      <div className="ka-lights"><i /><i /><i /></div>
      <div className="ka-notes" aria-hidden="true">{['♪', '♫', '♬', '♪', '♩', '♫', '♬', '♪'].map((n, i) => <span key={i} style={{ '--x': `${8 + i * 12}%`, '--d': `${i * 1.3}s` }}>{n}</span>)}</div>
      <div className="ka-fit" ref={fitRef}>
      <section className="ka-hero2">
        <p className="ka-live"><span className="live-dot" /> LIVE · {game?.day || today}</p>
        <h1 className="ka-neon">🎤 Karaoke <em>Showdown</em></h1>
        {game && !/karaoke/i.test(game.name) && <p className="ka-live">{game.name}</p>}
        <div className="ka-eq" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--d': `${(i * 137) % 900}ms` }} />)}</div>
      </section>
      <section className="wrap ka">
        <div className="ka-board">
          {board.map((r) => (
            <div key={`${r.k}-${bumps[r.k]?.n || 0}`} className={`ka-rank ${started && r.pos === 0 ? 'top' : ''} ${bumps[r.k] ? 'bump' : ''}`} style={{ '--c': r.c }}>
              {bumps[r.k] && <span className="ka-delta">{bumps[r.k].d > 0 ? '+' : ''}{bumps[r.k].d}</span>}
              <span className="ka-medal">{started ? MEDAL[r.pos] : '–'}</span>
              <b><i>{r.ic}</i>{r.name}</b>
              <span className="ka-pts"><Count value={r.total} /><small>pts</small></span>
            </div>
          ))}
        </div>

        {rounds.length > 0 && <div className="ka-tabs">
          {rounds.map((r) => <button key={r.id} className={cur !== 'all' && cur?.id === r.id ? 'on' : ''} onClick={() => setPick(r.id)}>Round {r.n}</button>)}
          <button className={cur === 'all' ? 'on' : ''} onClick={() => setPick('all')}>All rounds</button>
        </div>}

        <div className="ka-grid">
          {SB_TEAMS.map((t) => {
            const list = !rounds.length ? [{ id: 'none', n: 1 }] : cur === 'all' ? rounds : [cur]
            return (
              <div key={`${t.k}-${bumps[t.k]?.n || 0}`} className={`ka-card ${bumps[t.k] ? 'bump' : ''}`} style={{ '--c': t.c }}>
                <h3><i>{t.ic}</i>{t.name}</h3>
                {list.map((r) => {
                  const js = scores.find((x) => x.round_id === r.id && x.team === t.k)
                  return (
                    <div key={r.id} className="ka-round">
                      {cur === 'all' && <small>Round {r.n}</small>}
                      {judges.map((j, i) => (
                        <div key={j} className="ka-judge"><span>{j}</span><b>{js?.[`j${i + 1}`] ?? '–'}</b></div>
                      ))}
                      <div className="ka-total"><span>{cur === 'all' ? `Round ${r.n} total` : 'Round total'}</span><b><Count value={jsum(r.id, t.k) ?? 0} /></b></div>
                    </div>
                  )
                })}
                {cur === 'all' && <div className="ka-total ka-grand"><span>Karaoke total</span><b><Count value={ktot[t.k]} /></b></div>}
              </div>
            )
          })}
        </div>
      </section>
      </div>
    </div>
  )
}
