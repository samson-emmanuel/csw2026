import { useEffect, useMemo, useState } from 'react'
import { db, store } from './Gratitude.jsx'
import { SB_DAYS, SB_TEAMS, todayTab, useGames, useLive } from './Scoreboard.jsx'
import { useCountdownSounds } from './sounds.js'

const POINTS = 10

// Admin-only: pick the team that's up → Start (everyone sees the 60s countdown on the Scoreboard) → award +10
export function Buzzer() {
  const [code, setCode] = useState(() => store.get('gw-admin'))
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')
  const [winner, setWinner] = useState(null)
  const { team, left, total } = useLive()
  // Which game/round the points go to (defaults: today, last game touched, its latest round)
  const [games, reloadGames] = useGames()
  const [day, setDay] = useState(todayTab() === 'Overall' ? 'Day 1' : todayTab())
  const [gameId, setGameId] = useState('')
  const [roundId, setRoundId] = useState('')
  const dayGames = games.filter((g) => g.day === day)
  const game = dayGames.find((g) => g.id === gameId) || dayGames[0]
  const round = game?.rounds.find((r) => r.id === roundId) || game?.rounds[game.rounds.length - 1]
  const ringing = useCountdownSounds(left, false) // visuals only — sound plays on the Scoreboard

  useEffect(() => {
    if (!db || !code) return
    db.rpc('is_admin', { p_admin: code }).then(({ data }) => {
      if (data) setOk(true)
      else { store.set('gw-admin', null); setCode(null); setErr('Wrong admin passcode.') }
    })
  }, [code])

  const addPts = async (k, delta) => {
    if (!round) { setErr('Pick a game and round first.'); return false }
    const { error } = await db.rpc('admin_add_points', { p_admin: code, p_round: round.id, p_team: k, p_delta: delta })
    if (error) { setErr(error.message); return false }
    setErr(''); reloadGames(); return true
  }
  const award = async () => { if (await addPts(team.k, 10)) { setWinner(team); if (left > 0) set(team.k, false) } }
  const newRound = async () => { await db.rpc('admin_add_round', { p_admin: code, p_game: game.id }); setRoundId(''); reloadGames() }
  const set = async (k, start) => { const { error } = await db.rpc('admin_set_live', { p_admin: code, p_team: k, p_start: start }); if (error) setErr(error.message) }

  if (!ok) return (
    <section className="wrap admin">
      <form className="gw-card" onSubmit={(e) => { e.preventDefault(); const c = new FormData(e.target).get('admin'); store.set('gw-admin', c); setErr(''); setCode(c) }}>
        <h3>Challenge timer</h3>
        <p>Admins only.</p>
        <input name="admin" type="password" placeholder="Admin passcode" required />
        {err && <div className="gw-err">{err}</div>}
        <button className="btn">Unlock</button>
      </form>
    </section>
  )

  const running = left !== null && left > 0
  const timeUp = left === 0 && !winner
  const shown = left ?? total

  return (
    <section className={`bz ${running && left <= 10 ? 'hurry' : ''}`} style={team ? { '--tc': team.c } : undefined}>
      <div className="bz-pick">
        <select value={day} onChange={(e) => { setDay(e.target.value); setGameId(''); setRoundId('') }}>{SB_DAYS.map(([d]) => <option key={d}>{d}</option>)}</select>
        <select value={game?.id || ''} onChange={(e) => { setGameId(e.target.value); setRoundId('') }}>{dayGames.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <select value={round?.id || ''} onChange={(e) => setRoundId(e.target.value)}>{(game?.rounds || []).map((r) => <option key={r.id} value={r.id}>Round {r.n}</option>)}</select>
        {game && <button onClick={newRound}>+ Round</button>}
      </div>
      {round && (
        <div className="bz-scores">
          {SB_TEAMS.map((t) => (
            <span key={t.k} style={{ '--c': t.c }} className={team?.k === t.k ? 'cur' : ''}>
              {t.ic} <b>{round[t.k] ?? 0}</b>
              <button title={`Reset ${t.name} to 0 for Round ${round.n}`} onClick={() => confirm(`Reset ${t.name}'s score for ${game.name} · Round ${round.n} to 0?`) && addPts(t.k, -(Number(round[t.k]) || 0))}>↺</button>
            </span>
          ))}
        </div>
      )}
      <p className="eyebrow">{team ? <>Up now: <b className="bz-up-team">{team.ic} {team.name}</b></> : '60-Second Challenge'}</p>
      <div className="bz-ring" style={{ '--p': (shown / total) * 100 }}>
        <div className="bz-time">{ringing ? <span className="bell">🔔</span> : timeUp ? <img className="bz-logo" src="/logo.png" alt="Time’s up" /> : <><b>{shown}</b><small>seconds</small></>}</div>
      </div>

      {!running && !winner && (
        <div className="bz-teams">
          <p>{timeUp ? 'Time’s up — award the points, or pick the next team' : 'Select the team that’s up'}</p>
          <div>
            {SB_TEAMS.map((t, i) => (
              <button key={t.k} className={team?.k === t.k ? 'sel' : ''} style={{ '--c': t.c, '--d': `${i * 90}ms` }} onClick={() => set(t.k, false)}>
                <i>{t.ic}</i>{t.name}
              </button>
            ))}
          </div>
          <div className="bz-ctrl">
            <button className="btn bz-start" disabled={!team} onClick={() => { setWinner(null); set(team.k, true) }}>{timeUp ? '↻ Start again' : '▶ Start 60s'}</button>
            {timeUp && <button className="btn bz-award" onClick={award}>🏆 Award +{POINTS} to {team.name}</button>}
            {team && <button className="btn bz-minus" onClick={() => addPts(team.k, -1)}>−1 {team.name}</button>}
            {team && <button className="bz-stop" onClick={() => set(null, false)}>Clear</button>}
          </div>
        </div>
      )}

      {running && (
        <div className="bz-teams">
          <p>{team.name} is playing — did they get it?</p>
          <div className="bz-ctrl">
            <button className="btn bz-award" onClick={award}>🏆 Award +{POINTS}</button>
            <button className="btn bz-minus" onClick={() => addPts(team.k, -1)}>−1 point</button>
            <button className="bz-stop" onClick={() => set(team.k, false)}>Stop</button>
          </div>
        </div>
      )}

      {winner && <Celebrate team={winner} left={left} onClose={() => setWinner(null)} />}
      {err && <div className="gw-err">{err}</div>}
    </section>
  )
}

function Celebrate({ team, left, onClose }) {
  // Random confetti pieces, generated once per celebration
  const bits = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
    x: Math.random() * 100, d: Math.random() * 0.8, s: 6 + Math.random() * 8, r: Math.random() * 360,
    c: ['#ecbc40', '#d62d1f', '#ffffff', team.c, '#4ade80', '#03bbf1'][i % 6], t: 2.2 + Math.random() * 1.8,
  })), [team])
  return (
    <div className="bz-win" style={{ '--c': team.c }} onClick={onClose}>
      <div className="confetti">{bits.map((b, i) => <i key={i} style={{ left: `${b.x}%`, width: b.s, height: b.s * 0.45, background: b.c, animationDelay: `${b.d}s`, animationDuration: `${b.t}s`, '--r': `${b.r}deg` }} />)}</div>
      <div className="bz-card" onClick={(e) => e.stopPropagation()}>
        <div className="bz-burst" />
        <span className="bz-ic">{team.ic}</span>
        <h2>{team.name}</h2>
        <div className="bz-points">+{POINTS}<small>points</small></div>
        <p>{left > 0 ? `Answered with ${left} second${left === 1 ? '' : 's'} to spare!` : 'Got it at the buzzer!'}</p>
        <button className="btn" onClick={onClose}>Next round</button>
      </div>
    </div>
  )
}
