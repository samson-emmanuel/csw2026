import { useEffect, useMemo, useState } from 'react'
import { db, store } from './Gratitude.jsx'
import { SB_TEAMS, useLive } from './Scoreboard.jsx'

const POINTS = 10

// Admin-only: pick the team that's up → Start (everyone sees the 60s countdown on the Scoreboard) → award +10
export function Buzzer() {
  const [code, setCode] = useState(() => store.get('gw-admin'))
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')
  const [winner, setWinner] = useState(null)
  const { team, left, total } = useLive()

  useEffect(() => {
    if (!db || !code) return
    db.rpc('is_admin', { p_admin: code }).then(({ data }) => {
      if (data) setOk(true)
      else { store.set('gw-admin', null); setCode(null); setErr('Wrong admin passcode.') }
    })
  }, [code])

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
      <p className="eyebrow">{team ? <>Up now: <b className="bz-up-team">{team.ic} {team.name}</b></> : '60-Second Challenge'}</p>
      <div className="bz-ring" style={{ '--p': (shown / total) * 100 }}>
        <div className="bz-time">{timeUp ? <img className="bz-logo" src="/logo.png" alt="Time’s up" /> : <><b>{shown}</b><small>seconds</small></>}</div>
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
            {timeUp && <button className="btn bz-award" onClick={() => setWinner(team)}>🏆 Award +{POINTS} to {team.name}</button>}
            {team && <button className="bz-stop" onClick={() => set(null, false)}>Clear</button>}
          </div>
        </div>
      )}

      {running && (
        <div className="bz-teams">
          <p>{team.name} is playing — did they get it?</p>
          <div className="bz-ctrl">
            <button className="btn bz-award" onClick={() => { setWinner(team); set(team.k, false) }}>🏆 Award +{POINTS}</button>
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
