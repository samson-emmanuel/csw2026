import { useState } from 'react'
import teams from './teams.json'

// Colour + road-themed icon per team (from CSW_2026_Team_Assignments.xlsx; gender deliberately not shown)
const look = {
  Trailblazers: ['#d62d1f', '<path d="M12 2c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z"/>'],
  Pathfinders: ['#073485', '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'],
  Roadrunners: ['#e09a00', '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'],
  Milestones: ['#0f6b3c', '<path d="M6 21V4h9l-1 3 4 0v9h-9l1-3H6"/>'],
}
const rank = { 'Team Lead': 0, CRM: 1, '': 2 }

export function Teams() {
  const [q, setQ] = useState('')
  const [openT, setOpenT] = useState(null)
  const term = q.trim().toLowerCase()
  const hit = (m) => term && m.name.toLowerCase().includes(term)
  const found = term ? teams.flatMap((t) => t.members.filter(hit).map((m) => ({ ...m, team: t.name }))) : []

  return (
    <>
      <section className="hero small">
        <p className="eyebrow">CX Team Assignments</p>
        <h1>Meet the <em>Teams</em></h1>
        <p className="lead">Four teams, one road. Find your crew for the challenges, games and Team Colors Day.</p>
        <p className="team-hint">Search your name, or tap a team below to see its members.</p>
        <div className="team-search">
          <input placeholder="Find my team — type your name…" value={q} onChange={(e) => setQ(e.target.value)} />
          {term && <div className="team-found">
            {found.length ? found.slice(0, 5).map((m) => <span key={m.name + m.team}><b>{m.name}</b> → {m.team}</span>) : <span>No match — check the spelling.</span>}
          </div>}
        </div>
      </section>

      <section className="wrap teams">
        {teams.map((t) => {
          const [color, icon] = look[t.name] || ['#1a1a1a', '']
          const members = [...t.members].sort((a, b) => rank[a.role] - rank[b.role])
          const depts = Object.entries(t.members.reduce((a, m) => ({ ...a, [m.dept]: (a[m.dept] || 0) + 1 }), {}))
          const lit = t.members.some(hit)
          const open = openT === t.n || lit
          return (
            <article key={t.n} className={`team ${lit ? 'lit' : ''} ${open ? 'open' : ''}`} style={{ '--c': color }}>
              <button className="team-head" onClick={() => setOpenT(openT === t.n ? null : t.n)}>
                <span className="team-ic"><svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: icon }} /></span>
                <span className="team-title"><small>Team {t.n}</small><b>{t.name}</b></span>
                <span className="team-count">{t.members.length}<small>members</small></span>
              </button>
              <div className="team-depts">{depts.map(([d, n]) => <span key={d}>{d} · {n}</span>)}</div>
              <div className="team-leads">
                <span className="team-leads-h">Led by</span>
                {members.filter((m) => m.role).map((m) => (
                  <div key={m.name} className="co-lead">
                    <span className="team-av">{m.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                    <b>{m.name}</b>
                    <em>Team Lead</em>
                  </div>
                ))}
              </div>
              <button className="team-toggle" onClick={() => setOpenT(openT === t.n ? null : t.n)} aria-expanded={open}>
                {open ? 'Hide members' : `View all ${t.members.length} members`}<i>▾</i>
              </button>
              <ul className="team-list">
                {members.map((m) => (
                  <li key={m.name} className={`${m.role ? 'lead' : ''} ${hit(m) ? 'me' : ''}`}>
                    <span className="team-av">{m.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                    <span className="team-name">{m.name}{m.role && <em>Team Lead</em>}</span>
                    <span className="team-dept">{m.dept}</span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </section>
    </>
  )
}
