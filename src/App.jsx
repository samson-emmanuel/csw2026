import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { Gratitude, Admin, store } from './Gratitude.jsx'
import { Snapshots } from './Snapshots.jsx'
import { Commitment } from './Commitment.jsx'
import { Teams } from './Teams.jsx'
import { Scoreboard } from './Scoreboard.jsx'
import { Buzzer } from './Buzzer.jsx'
import { Games } from './Games.jsx'

const days = [
  { d: 'MON', t: 'Step Into Excellence', s: 'Kick-off ceremony + commitment wall', dress: 'Black and White', img: ['mon-v2'] },
  { d: 'TUE', t: 'Appreciation Day', s: 'Secret Service Hero recognitions', dress: 'Superhero-inspired costume / accessories', img: ['tue-v2'] },
  { d: 'WED', t: '“Walk In My Shoes” & CX Academy Launch', s: 'Job-shadowing & role swap', dress: 'Denim Day', img: ['wed-v2'] },
  { d: 'THU', t: 'Customer Delight Challenge', s: 'Team role-play competition', dress: 'Team Colors / Jersey Day', img: ['thu-v2'] },
  { d: 'FRI', t: '“Finish Strong” Celebration', s: 'Awards, games, music & refreshments', dress: 'Owambe Day · Native Attire', img: ['fri-v3'] },
  { d: 'SAT', t: 'CSW Finale Party', s: 'CX Team finale party', img: ['logo'] },
]

const agenda = [
  ['0900HRS', 'Formal Launch / Opening Remarks', 'CCEO'],
  ['0910HRS', '#TheExtraMile Charge', 'Commercial Director'],
  ['0915HRS', 'Weekly Activities Brief', 'HCXDI'],
  ['0920HRS', 'Cutting of CSWEEK Cake at Ikeja G.R.A Office', 'CX'],
  ['0925HRS', 'Group Pictures', 'All'],
  ['0930HRS', 'Goodwill Message to Staff & CX', 'EXCOMM / CLT'],
  ['1100HRS', 'Day 1 Activity: “Extra Mile” pledge to commitment wall', 'CX'],
]

const fun = [
  ['Pass The Smile', 'A rolling challenge that keeps energy and warmth moving through every team.'],
  ['CS Trivia Quiz', 'Quick-fire questions testing customer service knowledge and company values.'],
  ['Treasure Hunt', 'Clues built around our customer service values lead teams to a final prize.'],
  ['Gratitude Wall', 'Staff post thank-you notes to colleagues who made their week easier.'],
  ['Photo Booth', 'Footprints, road signs and “I Go the Extra Mile” placards for the wall of fame.'],
  ['Commitment Wall', "Monday's extra-mile promises stay up all week as a shared reminder."],
]

const leaders = [
  {
    name: 'Lolu Alade-Akinyemi', video: '1QiS5y9MSbzG9jcQYmfybTIaoAGNkvYor', photo: '/leaderships/lolu.webp', role: 'GMD/CEO', org: 'HBM Nigeria',
    bio: [
      '',
    ],
    quote: [],
  },
  {
    name: 'Gbenga Onimowo', video: '1D1OLDxgmefzcFc2HzCF35PSfUQlJMLJ2', photo: '/leaderships/ggc.webp', role: 'Commercial Director', org: 'HBM Nigeria',
    bio: [
      '',
    ],
    quote: [],
  },
  {
    name: 'Olatunji Adeleye', photo: '/leaderships/bosst-hd.webp', role: 'Head of Customer Experience and Digital Innovation', org: 'HBM Nigeria',
    bio: [
      'Welcome to Customer Service Week 2026. I’ve watched this team, all year, quietly go the extra mile: fixing problems before customers even notice them, turning frustration into trust, and building things nobody asked for but everyone now relies on. That is not an accident. It is a habit this team has built together, and this week we celebrate it. As you know, great experiences are designed, not accidental, and they are designed, and better still implemented, by you. Over the next six days we will walk in each other’s shoes, launch our CX Academy, and go head to head in the Customer Delight Challenge. I am asking every one of you to show up fully, not just in dress code, but in spirit, because the best version of this week is the one we build together, and have fun while at it.',
    ],
    quote: ['Great experiences are designed, not accidental. This week we celebrate the people who make them happen.', 'This team doesn’t just meet the moment, it goes past it. This week, we celebrate that, and we do it again.'],
  },
]

// CSW 2025 photos: Google Photos ids per day in public/gallery.json (from the shared albums)
const galleryDays = [
  ['day1', 'Day 1', 'Corporate Day'], ['day2', 'Day 2', 'Denim on Denim'], ['day3', 'Day 3', 'Old School Day'],
  ['day4', 'Day 4', 'Jersey Day'], ['day5', 'Day 5', 'Trad Day'], ['finale', 'Grand Finale', 'All White Party'],
]
const gp = (id, w) => `https://lh3.googleusercontent.com/pw/${id}=w${w}`
const PAGE = 12

// Add photos as public/fun/1.webp … 6.webp (same order as `fun`); icons show until then
const funIcons = ['😊', '❓', '🧭', '💌', '📸', '🤝']

function FunImg({ i, t }) {
  const [err, setErr] = useState(false)
  return (
    <div className="fun-img">
      {err ? <span>{funIcons[i]}</span> : <img src={`/fun/${i + 1}.webp`} alt={t} loading="lazy" onError={() => setErr(true)} />}
    </div>
  )
}

const tiles = [
  ['#/week', 'The Road Ahead', 'The six-day journey, daily themes, dress codes and the flag-off agenda.', 'Oct 5 – 10', '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'],
  ['#/fun', 'Fun Zone', 'Trivia, treasure hunt, gratitude wall and the Extra-Mile finale party.', '6 activities', '<path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8l5.5-.8z"/>'],
  ['#/leaders', 'Leadership', 'Messages from the leaders championing customer excellence.', '3 leaders', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'],
  ['#/gallery', 'Memory Lane', 'Moments and highlights from Customer Service Week 2025.', 'CSW 2025', '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>'],
]

const initials = (n) => n.split(/[\s-]+/).map((w) => w[0]).slice(0, 2).join('')

function useRoute() {
  const [r, setR] = useState(window.location.hash || '#/')
  useEffect(() => {
    const f = () => { setR(window.location.hash || '#/'); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return r
}

// Flag-off: Mon 5 Oct 2026, 09:00 Nigeria time (WAT) for every viewer
const LAUNCH = new Date('2026-10-05T09:00:00+01:00').getTime()

function Countdown({ ms }) {
  const parts = [[86400000, 'Days'], [3600000, 'Hrs'], [60000, 'Min'], [1000, 'Sec']]
  const soon = ms <= 3 * 86400000 // final 3 days: Days box turns yellow and blinks
  let rest = ms
  return (
    <div className={`count ${soon ? 'soon' : ''}`}>
      {parts.map(([u, l]) => { const v = Math.floor(rest / u); rest -= v * u; return <div key={l}><b>{String(v).padStart(2, '0')}</b><span>{l}</span></div> })}
    </div>
  )
}

// Menu: plain links and drop-down groups [label, [[href, title, description], ...]]
const MENU = [
  ['#/', 'Home'],
  ['The Week', [
    ['#/week', 'The Road Ahead', 'Daily schedule, dress codes & flag-off'],
    ['#/fun', 'Fun Zone', 'Activities, games & the finale party'],
    ['#/teams', 'The Teams', 'Find your team for the week'],
    ['#/games', 'Game Rules', 'How each of the 4 games is played'],
    ['#/scoreboard', 'Scoreboard', 'Live game scores & team standings'],
  ]],
  ['#/leaders', 'Leadership'],
  ['Get Involved', [
    ['#/commitment', 'Commitment Wall', 'Make your Extra Mile pledge'],
    ['#/gratitude', 'Gratitude Wall', 'Say thank you to a colleague'],
    ['#/snapshots', 'Snapshots', 'Share your photos from the week'],
  ]],
  ['CSW 2025', [
    ['#/rewind', 'Rewind', 'Highlight videos from last year'],
    ['#/gallery', 'Memory Lane', 'Photos from every day of CSW 2025'],
  ]],
]

// Extra menu group shown only while an admin is unlocked
const ADMIN_MENU = ['Admin', [
  ['#/admin', 'Dashboard', 'Approvals, scores, staff & notes'],
  ['#/timer', 'Challenge timer', 'Pick the team, start the 60s, award points'],
  ['#/scoreboard', 'Live scoreboard', 'What everyone sees'],
  ['#lock', '🔒 Lock admin', 'Sign out of admin on this device'],
]]

function Nav({ route }) {
  const [open, setOpen] = useState(false)
  const [drop, setDrop] = useState(null)
  const [isAdmin, setIsAdmin] = useState(() => !!store.get('gw-admin'))
  useEffect(() => {
    const f = () => setIsAdmin(!!store.get('gw-admin'))
    window.addEventListener('gw-admin', f)
    return () => window.removeEventListener('gw-admin', f)
  }, [])
  const menu = isAdmin ? [...MENU, ADMIN_MENU] : MENU
  useEffect(() => { setOpen(false); setDrop(null) }, [route])
  return (
    <header className={`nav ${open ? 'open' : ''}`}>
      <a href="#/" className="logo"><img src="/logo.png" alt="CSW 2026 The Extra Mile" />CSW<span>2026</span></a>
      <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><i /><i /><i /></button>
      <nav>
        {menu.map(([a, b]) => Array.isArray(b) ? (
          <div key={a} className={`nav-group ${a === 'Admin' ? 'nav-admin' : ''} ${b.some(([h]) => h === route) ? 'on' : ''} ${drop === a ? 'show' : ''}`}
            onMouseEnter={() => setDrop(a)} onMouseLeave={() => setDrop(null)}>
            <button className="nav-top" aria-expanded={drop === a} onClick={() => setDrop(drop === a ? null : a)}>{a}<i>▾</i></button>
            <div className="nav-drop">
              {b.map(([h, t, d]) => (
                <a key={h} href={h === '#lock' ? '#/' : h} className={route === h ? 'on' : ''} onClick={h === '#lock' ? () => store.set('gw-admin', null) : undefined}><b>{t}</b><small>{d}</small></a>
              ))}
            </div>
          </div>
        ) : (
          <a key={a} href={a} className={`nav-top ${route === a ? 'on' : ''}`}>{b}</a>
        ))}
      </nav>
    </header>
  )
}

function Home() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])
  const ms = Math.max(0, LAUNCH - now)
  // countdown finished: the title takes its place (preview any time with ?live in the URL)
  const live = ms === 0 || new URLSearchParams(window.location.search).has('live')
  return (
    <>
      <section className="hero">
        <div className="road" />
        <img className="hero-logo" src="/logo.png" alt="The Extra Mile" />
        <p className="eyebrow">{live ? 'Oct 5 – 10, 2026 · Live now' : 'Customer Service Week · Oct 5 – 10, 2026'}</p>
        {live ? <><h1 className="hero-big">Customer <em>Service</em> Week</h1><p className="hero-sub">The <em>Extra</em> Mile</p></> : <Countdown ms={ms} />}
        <p className="lead">Six days. Six milestones. One commitment — to meet every customer challenge with determination, creativity and teamwork.</p>
        {!live && <h1 className="hero-title">The <em>Extra</em> Mile</h1>}
        <a className="btn" href="#/week">Explore the week</a>
      </section>
      <NowNext />

      <section className="wrap split">
        <div>
          <p className="eyebrow">Objective</p>
          <h2>Celebrating the people behind every great experience</h2>
        </div>
        <p>Customer Service Week (CSW) is a global celebration held annually during the first full week of October to recognize the vital role of customer service. In 2026, it runs from <b>Monday, October 5</b> to <b>Saturday, October 10</b>. This year’s theme motivates teams to approach customer challenges with determination, creativity and teamwork to deliver impactful solutions.</p>
      </section>

      <section className="wrap explore">
        <div className="explore-head">
          <div>
            <p className="eyebrow">Explore</p>
            <h2>Everything for the week, in one place</h2>
          </div>
          <p>From the daily schedule to messages from leadership — find your way around Customer Service Week 2026.</p>
        </div>
        <div className="tiles">
          {tiles.map(([h, t, d, m, ic]) => (
            <a key={h} href={h} className="tile">
              <span className="tile-ic"><svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: ic }} /></span>
              <span className="tile-meta">{m}</span>
              <h4>{t}</h4>
              <p>{d}</p>
              <span className="tile-go">Explore <i>→</i></span>
            </a>
          ))}
        </div>
      </section>
    </>
  )
}

// Flag-off day; each item is "soon" 10 min before, "live" until the next item starts
const FLAG_DAY = '2026-10-05'
const at = (i) => new Date(`${FLAG_DAY}T${agenda[i][0].slice(0, 2)}:${agenda[i][0].slice(2, 4)}:00`).getTime()

function useNow(ms = 15000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(i) }, [ms])
  return now
}

function status(i, now) {
  const start = at(i)
  const end = agenda[i + 1] ? at(i + 1) : start + 3600000
  if (now >= end) return 'done'
  if (now >= start) return 'live'
  if (start - now <= 600000) return 'soon'
  return ''
}

const badge = { live: 'Live now', soon: 'Up next', done: 'Done' }

const hhmm = (w) => w.replace(/(\d\d)(\d\d)HRS/, '$1:$2')
const mmss = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(t / 3600); const m = Math.floor(t / 60) % 60; return `${h ? h + 'h ' : ''}${String(m).padStart(2, '0')}m ${String(t % 60).padStart(2, '0')}s` }

function NowNext() {
  const now = useNow(1000)
  // Only shown on the flag-off day itself
  if (new Date(now).toDateString() !== new Date(`${FLAG_DAY}T00:00`).toDateString()) return null
  const live = agenda.findIndex((_, i) => status(i, now) === 'live')
  const next = agenda.findIndex((_, i) => at(i) > now)
  const allDone = live < 0 && next < 0
  const end = live >= 0 ? (agenda[live + 1] ? at(live + 1) : at(live) + 3600000) : 0
  const pct = live >= 0 ? Math.min(100, ((now - at(live)) / (end - at(live))) * 100) : 0
  return (
    <section className="nownext">
      <div className="nn-card nn-now">
        <div className="nn-top"><span className={`nn-dot ${live >= 0 ? 'on' : ''}`} />{live >= 0 ? 'Happening now' : allDone ? 'Flag off complete' : 'Not started yet'}</div>
        {live >= 0 ? (
          <>
            <time>{hhmm(agenda[live][0])}</time>
            <h3>{agenda[live][1]}</h3>
            <p>Led by <b>{agenda[live][2]}</b></p>
            <div className="nn-bar"><i style={{ width: `${pct}%` }} /></div>
            <small>{mmss(end - now)} remaining</small>
          </>
        ) : allDone ? (
          <><h3>Thank you for joining the virtual flag off!</h3><p>The Extra Mile continues all week.</p></>
        ) : (
          <><h3>Virtual Flag Off</h3><p>Starts in <b>{mmss(at(0) - now)}</b></p></>
        )}
      </div>
      <div className="nn-card nn-next">
        <div className="nn-top">Up next</div>
        {next >= 0 ? (
          <>
            <time>{hhmm(agenda[next][0])}</time>
            <h4>{agenda[next][1]}</h4>
            <p>{agenda[next][2]} · in {mmss(at(next) - now)}</p>
          </>
        ) : <h4>That’s a wrap for today</h4>}
        <a href="#/week">Full agenda →</a>
      </div>
    </section>
  )
}

function Week() {
  const now = useNow()
  return (
    <>
      <section className="wrap">
        <p className="eyebrow">Six Days, Six Milestones</p>
        <h2>The journey</h2>
        <div className="days">
          {days.map((x, i) => (
            <article key={x.d} className="day">
              <span className="mile">MILE {String(i + 1).padStart(2, '0')}</span>
              <h3>{x.d}</h3>
              <h4>{x.t}</h4>
              <p>{x.s}</p>
              {x.img && <div className="dress">{x.img.map((m) => <img key={m} src={m === 'logo' ? '/logo.png' : `/dress/${m}.webp`} alt={x.dress} loading="lazy" />)}</div>}
              {x.dress && <small>Dress code · {x.dress}</small>}
            </article>
          ))}
        </div>
      </section>

      <section className="dark">
        <div className="wrap">
          <div className="flag-head">
            <div>
              <p className="eyebrow">Monday · Virtual Flag Off</p>
              <h2>Opening day agenda</h2>
            </div>
            <div className="live"><i />09:00 – 11:00 · Ikeja G.R.A Office</div>
          </div>
          <ol className="timeline">
            {agenda.map(([w, t, who], i) => (
              <li key={w} className={status(i, now)} style={{ '--d': `${i * 80}ms` }}>
                <span className="node">{String(i + 1).padStart(2, '0')}</span>
                <div className="card">
                  <time>{w.replace(/(\d\d)(\d\d)HRS/, '$1:$2')}</time>
                  <h4>{t}{badge[status(i, now)] && <b className="state">{badge[status(i, now)]}</b>}</h4>
                  <em>{who}</em>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

    </>
  )
}

function Fun() {
  return (
    <>
      <section className="wrap">
        <a href="#/teams" className="teams-cta"><span>👥</span><div><b>Which team are you on?</b><small>Trailblazers · Pathfinders · Pacesetters · Milestones</small></div><i>Find my team →</i></a>
        <p className="eyebrow">Inter-Team Games</p>
        <h2>Throughout the week</h2>
        <div className="fun">
          {fun.map(([t, s], i) => {
            const link = { 'Gratitude Wall': '#/gratitude', 'Commitment Wall': '#/commitment' }[t]
            const body = <><FunImg i={i} t={t} /><b>0{i + 1}</b><h4>{t}</h4><p>{s}</p>{link && <span className="fun-go">Open {t} →</span>}</>
            return link ? <a key={t} href={link} className="fun-card">{body}</a> : <article key={t}>{body}</article>
          })}
        </div>
      </section>

      <section className="finale">
        <p className="eyebrow">Finale · Extra-Mile Party</p>
        <h2>Team bonding & finale party</h2>
        <p className="big">10th October · 2:00PM</p>
        <p>Trivia winners take home a branded thermochromic mug. See you at the finish line.</p>
      </section>
    </>
  )
}

// Video speech from Google Drive; loads only when Play is clicked
function LeaderVideo({ l }) {
  const [play, setPlay] = useState(false)
  return (
    <div className="lv">
      <span className="lv-label">Video message</span>
      <div className="lv-frame">
        {play ? (
          <iframe src={`https://drive.google.com/file/d/${l.video}/preview`} title={`Video message from ${l.name}`} allow="autoplay; fullscreen" allowFullScreen />
        ) : (
          <button className="lv-poster" onClick={() => setPlay(true)} aria-label={`Play video message from ${l.name}`}>
            {l.photo && <img src={l.photo} alt="" />}
            <span className="lv-play">▶</span>
            <span className="lv-cap">Watch the message from {l.name.split(' ')[0]}</span>
          </button>
        )}
      </div>
    </div>
  )
}

function Leaders() {
  return (
    <>
      <section className="hero small">
        <p className="eyebrow">Leadership Messages</p>
        <h1>Leading the <em>Extra</em> Mile</h1>
        <p className="lead">The leaders championing customer excellence for Customer Service Week 2026.</p>
      </section>
      <section className="wrap leaders">
        {leaders.map((l, i) => (
          <article key={l.name} className={`leader ${i % 2 ? 'rev' : ''}`}>
            <div className="portrait">
              {l.photo ? <img className="leader-photo" src={l.photo} alt={l.name} /> : <div className="mono">{initials(l.name)}</div>}
              <div className="tag">
                <strong>{l.name}</strong>
                <span>{l.role}</span>
                <small>{l.org}</small>
              </div>
            </div>
            <div className="bio">
              <p className="eyebrow">{l.role}</p>
              <h2>{l.name}</h2>
              {l.video ? <LeaderVideo l={l} /> : <p className="speech">{l.bio[0]}</p>}
              {l.bio.slice(1).map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
              {[].concat(l.quote).map((q) => <blockquote key={q}>“{q}”</blockquote>)}
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

function Photo({ src, cap, i, onOpen }) {
  const [err, setErr] = useState(false)
  return (
    <figure className={`shot s${i % 5}`} onClick={onOpen}>
      {err ? <div className="ph">CSW 2025</div> : <img src={gp(src, 700)} alt={cap} loading="lazy" referrerPolicy="no-referrer" onError={() => setErr(true)} />}
    </figure>
  )
}

// Full-screen slideshow through every day's photos (Day 1 → Grand Finale)
function Slideshow({ data, onClose }) {
  const slides = useMemo(() => galleryDays.flatMap(([k, d, t]) => (data[k] || []).map((id) => [id, `${d} · ${t}`])), [data])
  const [i, setI] = useState(0)
  const [prev, setPrev] = useState(null) // previous slide, kept briefly to animate it out
  const [playing, setPlaying] = useState(true)
  const go = useCallback((d) => setI((x) => { setPrev(x); return (x + d + slides.length) % slides.length }), [slides.length])
  useEffect(() => { if (!playing || !slides.length) return; const t = setTimeout(() => go(1), 4000); return () => clearTimeout(t) }, [i, playing, go, slides.length])
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p) } }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [go, onClose])
  if (!slides.length) return null
  const [id, label] = slides[i]
  return (
    <div className="slides">
      {prev !== null && prev !== i && <img key={`out-${slides[prev][0]}`} className={`slide-img out fx${prev % 3}`} src={gp(slides[prev][0], 1920)} alt="" referrerPolicy="no-referrer" />}
      <div key={`in-${id}`} className={`slide-frame in fx${i % 3}`}><img className="slide-img kb" src={gp(id, 1920)} alt={label} referrerPolicy="no-referrer" /></div>
      <img className="slide-pre" src={gp(slides[(i + 1) % slides.length][0], 1920)} alt="" referrerPolicy="no-referrer" />
      <div className="slide-top"><b>{label}</b><span>{i + 1} / {slides.length}</span></div>
      <div className="slide-bar"><i key={`${i}-${playing}`} className={playing ? 'run' : ''} /></div>
      <div className="slide-ctrl">
        <button onClick={() => go(-1)} aria-label="Previous">⏮</button>
        <button className="pp" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸' : '▶'}</button>
        <button onClick={() => go(1)} aria-label="Next">⏭</button>
      </div>
      <button className="lb-close" onClick={onClose} aria-label="Close">✕</button>
    </div>
  )
}

function Gallery() {
  const [data, setData] = useState({})
  const [day, setDay] = useState('day1')
  const [count, setCount] = useState(PAGE)
  const [open, setOpen] = useState(null)
  const [show, setShow] = useState(false)
  useEffect(() => { fetch('/gallery.json').then((r) => r.json()).then(setData).catch(() => {}) }, [])
  const label = galleryDays.find((g) => g[0] === day)
  const all = (data[day] || []).map((id) => [id, `${label[1]} · ${label[2]}`])
  const shown = all.slice(0, count)
  const pick = (k) => { setDay(k); setCount(PAGE); setOpen(null) }
  useEffect(() => {
    if (open === null) return
    const k = (e) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((o) => (o + 1) % shown.length)
      if (e.key === 'ArrowLeft') setOpen((o) => (o + shown.length - 1) % shown.length)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, shown.length])
  return (
    <>
      <section className="hero small">
        <p className="eyebrow">Memory Lane · CSW 2025</p>
        <h1>Miles <em>Behind</em> Us</h1>
        <p className="lead">Highlights from last year’s Customer Service Week — the moments that paved the road to The Extra Mile.</p>
      </section>
      <section className="wrap">
        <button className="btn g-play" onClick={() => setShow(true)} disabled={!Object.keys(data).length}>▶ Play slideshow · all days</button>
        {show && <Slideshow data={data} onClose={() => setShow(false)} />}
        <div className="g-tabs">
          {galleryDays.map(([k, d, t]) => (
            <button key={k} className={day === k ? 'on' : ''} onClick={() => pick(k)}>{d} · {t}</button>
          ))}
        </div>
        <div className="gallery">
          {shown.map(([f, c], i) => <Photo key={f} src={f} cap={c} i={i} onOpen={() => setOpen(i)} />)}
        </div>
        {count < all.length && (
          <div className="g-more">
            <button onClick={() => setCount(count + PAGE)}>Load more</button>
            <span>Showing {shown.length} of {all.length}</span>
          </div>
        )}
      </section>
      {open !== null && (
        <div className="lightbox" onClick={() => setOpen(null)}>
          <button className="lb-nav prev" onClick={(e) => { e.stopPropagation(); setOpen((open + shown.length - 1) % shown.length) }}>‹</button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={gp(shown[open][0], 1600)} alt={shown[open][1]} referrerPolicy="no-referrer" />
            <figcaption>{shown[open][1]} <span>{open + 1} / {shown.length}</span></figcaption>
          </figure>
          <button className="lb-nav next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % shown.length) }}>›</button>
          <button className="lb-close" onClick={() => setOpen(null)}>✕</button>
        </div>
      )}
    </>
  )
}

// Videos hosted on Google Drive (shared "Anyone with the link"); add more as [driveId, title, subtitle]
const videos = [
  ['1-Ntm4s3ALGDT-fSkY7XrImI53O7WXhHL', 'CSW 2025 Recap', 'The full week · Day 1 to the Grand Finale'],
  ['1qy5xZqsusnqUD4BM67DNy-IM64Hea7RS', 'Day 2 Highlights', 'CSW 2025 · Denim on Denim'],
]

function Rewind() {
  const [cur, setCur] = useState(0)
  const [id, title, sub] = videos[cur]
  return (
    <>
      <section className="hero small">
        <p className="eyebrow">Rewind · CSW 2025</p>
        <h1>Relive the <em>Moments</em></h1>
        <p className="lead">Watch the highlights from last year’s Customer Service Week.</p>
      </section>
      <section className="wrap rewind">
        <div className="player">
          <iframe src={`https://drive.google.com/file/d/${id}/preview`} title={title} allow="autoplay; fullscreen" allowFullScreen />
        </div>
        <div className="v-meta"><div><p className="eyebrow">{sub}</p><h2>{title}</h2></div></div>
        {videos.length > 1 && (
          <div className="v-list">
            {videos.map(([v, t, st], i) => (
              <button key={v} className={i === cur ? 'on' : ''} onClick={() => setCur(i)}><b>{t}</b><span>{st}</span></button>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

/* global __BUILD_ID__ */
// Checks for a newer deploy every minute and when the tab regains focus.
// Hidden tab → reload silently; visible → show a Refresh bar (never interrupts someone mid-task).
function useUpdateReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!r.ok) return
        const { v } = await r.json()
        if (v && v !== __BUILD_ID__) { if (document.hidden) window.location.reload(); else setReady(true) }
      } catch { /* offline or dev server */ }
    }
    const i = setInterval(check, 60000)
    const onVis = () => { if (!document.hidden) check() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(i); document.removeEventListener('visibilitychange', onVis) }
  }, [])
  return ready
}

export default function App() {
  const updateReady = useUpdateReady()
  const route = useRoute()
  return (
    <>
      <Nav route={route} />
      <main>{({ '#/week': <Week />, '#/fun': <Fun />, '#/leaders': <Leaders />, '#/gallery': <Gallery />, '#/rewind': <Rewind />, '#/gratitude': <Gratitude />, '#/admin': <Admin />, '#/snapshots': <Snapshots />, '#/commitment': <Commitment />, '#/teams': <Teams />, '#/scoreboard': <Scoreboard />, '#/timer': <Buzzer />, '#/games': <Games /> })[route] || <Home />}</main>
      {updateReady && <div className="update-bar">✨ The site has been updated <button onClick={() => window.location.reload()}>Refresh</button></div>}
      <footer>Customer Service Week 2026 — <b>The Extra Mile</b> · #TheExtraMile</footer>
    </>
  )
}
