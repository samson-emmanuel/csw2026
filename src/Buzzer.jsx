import { useEffect, useMemo, useState } from 'react'
import { db, store } from './Gratitude.jsx'
import { SB_TEAMS } from './Scoreboard.jsx'

const SECONDS = 60
const POINTS = 10

// Admin-only 60-second challenge timer: Start → team buttons → winner gets a +10 celebration
export function Buzzer() {
  const [code, setCode] = useState(() => store.get('gw-admin'))
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')
  const [left, setLeft] = useState(SECONDS)
  const [running, setRunning] = useState(false)
  const [winner, setWinner] = useState(null)

  // Verify the stored admin passcode
  useEffect(() => {
    if (!db || !code) return
    db.rpc('is_admin', { p_admin: code }).then(({ data }) => {
      if (data) setOk(true)
      else { store.set('gw-admin', null); setCode(null); setErr('Wrong admin passcode.') }
    })
  }, [code])

  useEffect(() => {
    if (!running) return
    const i = setInterval(() => setLeft((s) => {
      if (s <= 1) { setRunning(false); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(i)
  }, [running])

  const start = () => { setWinner(null); setLeft(SECONDS); setRunning(true) }
  const pick = (t) => { setRunning(false); setWinner(t) }
  const reset = () => { setRunning(false); setWinner(null); setLeft(SECONDS) }

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

  const pct = (left / SECONDS) * 100
  const timeUp = !running && left === 0 && !winner

  return (
    <section className={`bz ${left <= 10 && running ? 'hurry' : ''}`}>
      <p className="eyebrow">60-Second Challenge</p>
      <div className="bz-ring" style={{ '--p': pct }}>
        <div className="bz-time">{timeUp ? <img className="bz-logo" src="/logo.png" alt="Time’s up" /> : <><b>{left}</b><small>seconds</small></>}</div>
      </div>

      {!running && !winner && (
        <button className="btn bz-start" onClick={start}>{timeUp ? '↻ Start again' : '▶ Start'}</button>
      )}
      {timeUp && <div className="bz-up">⏰ Time’s up!</div>}

      {(running || timeUp) && (
        <div className="bz-teams">
          <p>{timeUp ? 'Time’s up — award the points?' : 'Which team got it?'}</p>
          <div>
            {SB_TEAMS.map((t, i) => (
              <button key={t.k} style={{ '--c': t.c, '--d': `${i * 90}ms` }} onClick={() => pick(t)}>
                <i>{t.ic}</i>{t.name}
              </button>
            ))}
          </div>
          {running && <button className="bz-stop" onClick={reset}>Stop</button>}
        </div>
      )}

      {winner && <Celebrate team={winner} left={left} onClose={reset} />}
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
