import { useEffect, useState } from 'react'
import './App.css'
import { Gratitude, Admin } from './Gratitude.jsx'
import { Snapshots } from './Snapshots.jsx'
import { Commitment } from './Commitment.jsx'

const days = [
  { d: 'MON', t: 'Step Into Excellence', s: 'Kick-off ceremony + commitment wall', dress: 'Black and White', img: ['mon-v2'] },
  { d: 'TUE', t: 'Appreciation Day', s: 'Secret Service Hero recognitions', dress: 'Superhero-inspired costume / accessories', img: ['tue-v2'] },
  { d: 'WED', t: '“Walk In My Shoes” & CX Academy Launch', s: 'Job-shadowing & role swap', dress: 'Denim Day', img: ['wed-v2'] },
  { d: 'THU', t: 'Customer Delight Challenge', s: 'Team role-play competition', dress: 'Team Colors / Jersey Day', img: ['thu-v2'] },
  { d: 'FRI', t: '“Finish Strong” Celebration', s: 'Awards, games, music & refreshments', dress: 'Owambe Day · Native Attire', img: ['fri-v3'] },
  { d: 'SAT', t: 'CSW Finale Party', s: 'Bonus celebration after the working week — CX Team finale party' },
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
    name: 'Lolu Alade-Akinyemi', role: 'GMD/CEO', org: 'HBM Nigeria',
    bio: [
      '',
    ],
    quote: [],
  },
  {
    name: 'Gbenga Onimowo', role: 'Commercial Director', org: 'HBM Nigeria',
    bio: [
      '',
    ],
    quote: [],
  },
  {
    name: 'Olatunji Adeleye', role: 'Head of Customer Experience & Innovation', org: 'HBM Nigeria',
    bio: [
      'Welcome to Customer Service Week 2026. I’ve watched this team, all year, quietly go the extra mile: fixing problems before customers even notice them, turning frustration into trust, and building things nobody asked for but everyone now relies on. That is not an accident. It is a habit this team has built together, and this week we celebrate it. As you know, great experiences are designed, not accidental, and they are designed, and better still implemented, by you. Over the next six days we will walk in each other’s shoes, launch our CX Academy, and go head to head in the Customer Delight Challenge. I am asking every one of you to show up fully, not just in dress code, but in spirit, because the best version of this week is the one we build together, and have fun while at it.',
      'The driving force behind Customer Service Week 2026, they oversee the week’s programme, including the launch of the CX Academy, the “Walk In My Shoes” job-shadowing initiative and the Customer Delight Challenge.',
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
  ['#/week', 'The Road Ahead', 'The five-day journey, daily themes, dress codes and the flag-off agenda.', 'Oct 5 – 10', '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'],
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

function Countdown() {
  const target = new Date('2026-10-05T09:00:00').getTime()
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])
  const ms = Math.max(0, target - now)
  const parts = [[86400000, 'Days'], [3600000, 'Hrs'], [60000, 'Min'], [1000, 'Sec']]
  let rest = ms
  return (
    <div className="count">
      {parts.map(([u, l]) => { const v = Math.floor(rest / u); rest -= v * u; return <div key={l}><b>{String(v).padStart(2, '0')}</b><span>{l}</span></div> })}
    </div>
  )
}

function Nav({ route }) {
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [route])
  return (
    <header className={`nav ${open ? 'open' : ''}`}>
      <a href="#/" className="logo"><img src="/logo.png" alt="CSW 2026 The Extra Mile" />CSW<span>2026</span></a>
      <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><i /><i /><i /></button>
      <nav>
        <a href="#/" className={route === '#/' ? 'on' : ''}>Home</a>
        <a href="#/week" className={route === '#/week' ? 'on' : ''}>The Road Ahead</a>
        <a href="#/fun" className={route === '#/fun' ? 'on' : ''}>Fun Zone</a>
        <a href="#/leaders" className={route === '#/leaders' ? 'on' : ''}>Leadership</a>
        <a href="#/commitment" className={route === '#/commitment' ? 'on' : ''}>Commitment Wall</a>
        <a href="#/gratitude" className={route === '#/gratitude' ? 'on' : ''}>Gratitude Wall</a>
        <a href="#/rewind" className={route === '#/rewind' ? 'on' : ''}>Rewind</a>
        <a href="#/snapshots" className={route === '#/snapshots' ? 'on' : ''}>Snapshots</a>
        <a href="#/gallery" className={route === '#/gallery' ? 'on' : ''}>Memory Lane</a>
      </nav>
    </header>
  )
}

function Home() {
  return (
    <>
      <section className="hero">
        <div className="road" />
        <img className="hero-logo" src="/logo.png" alt="The Extra Mile" />
        <p className="eyebrow">Customer Service Week · Oct 5 – 9, 2026</p>
        <h1>The <em>Extra</em> Mile</h1>
        <p className="lead">Five days. Five milestones. One commitment — to meet every customer challenge with determination, creativity and teamwork.</p>
        <Countdown />
        <a className="btn" href="#/week">Explore the week</a>
      </section>
      <NowNext />

      <section className="wrap split">
        <div>
          <p className="eyebrow">Objective</p>
          <h2>Celebrating the people behind every great experience</h2>
        </div>
        <p>Customer Service Week (CSW) is a global celebration held annually during the first full week of October to recognize the vital role of customer service. In 2026, it runs from <b>Monday, October 5</b> to <b>Friday, October 9</b>. This year’s theme motivates teams to approach customer challenges with determination, creativity and teamwork to deliver impactful solutions.</p>
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
        <p className="eyebrow">Five Days, Five Milestones</p>
        <h2>The journey</h2>
        <div className="days">
          {days.map((x, i) => (
            <article key={x.d} className="day">
              <span className="mile">{i < 5 ? `MILE ${String(i + 1).padStart(2, '0')}` : '🏁 THE FINISH LINE · OCT 10'}</span>
              <h3>{x.d}</h3>
              <h4>{x.t}</h4>
              <p>{x.s}</p>
              {x.img && <div className="dress">{x.img.map((m) => <img key={m} src={`/dress/${m}.webp`} alt={x.dress} loading="lazy" />)}</div>}
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
        <p className="eyebrow">Fun & Engagement</p>
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
              <div className="mono">{initials(l.name)}</div>
              <div className="tag">
                <strong>{l.name}</strong>
                <span>{l.role}</span>
                <small>{l.org}</small>
              </div>
            </div>
            <div className="bio">
              <p className="eyebrow">{l.role}</p>
              <h2>{l.name}</h2>
              <p className="speech">{l.bio[0]}</p>
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
      <figcaption>{cap}</figcaption>
    </figure>
  )
}

function Gallery() {
  const [data, setData] = useState({})
  const [day, setDay] = useState('day1')
  const [count, setCount] = useState(PAGE)
  const [open, setOpen] = useState(null)
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

export default function App() {
  const route = useRoute()
  return (
    <>
      <Nav route={route} />
      <main>{({ '#/week': <Week />, '#/fun': <Fun />, '#/leaders': <Leaders />, '#/gallery': <Gallery />, '#/rewind': <Rewind />, '#/gratitude': <Gratitude />, '#/admin': <Admin />, '#/snapshots': <Snapshots />, '#/commitment': <Commitment /> })[route] || <Home />}</main>
      <footer>Customer Service Week 2026 — <b>The Extra Mile</b> · #TheExtraMile</footer>
    </>
  )
}
