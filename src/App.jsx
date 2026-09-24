import { useEffect, useState } from 'react'
import './App.css'

const days = [
  { d: 'MON', t: 'Step Into Excellence', s: 'Kick-off ceremony + commitment wall', dress: 'Naija Day', img: ['mon'] },
  { d: 'TUE', t: 'Appreciation Day', s: 'Secret Service Hero recognitions', dress: 'Superhero-inspired costume / accessories', img: ['tue', 'tue2'] },
  { d: 'WED', t: '“Walk In My Shoes” & CX Academy Launch', s: 'Job-shadowing & role swap', dress: 'Denim Day', img: ['wed'] },
  { d: 'THU', t: 'Customer Delight Challenge', s: 'Team role-play competition', dress: 'Team Colors / Jersey Day', img: ['thu'] },
  { d: 'FRI', t: '“Finish Strong” Celebration', s: 'Awards, games, music & refreshments', dress: 'All Black', img: ['fri'] },
  { d: 'SAT', t: 'CSW Finale Party', s: 'CX Team finale party' },
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
    name: 'Lolu Alade-Akinyemi', role: 'GMD/CEO', org: 'HUAXIN Cement Co., Ltd.',
    bio: [
      'Dear colleagues, this Customer Service Week I want to thank every one of you. Our customers build the future with us, and it is your care, patience and determination that earns their trust every day. This year’s theme, “The Extra Mile”, is a challenge I am asking all of us to take personally — from the plant floor to the front desk, let us meet every customer challenge with creativity and teamwork.',
      'For Customer Service Week 2026, the GMD/CEO champions “The Extra Mile” — a call for every team, from the plant floor to the front desk, to meet customer challenges with determination, creativity and teamwork.',
    ],
    quote: 'Our customers build the future with us. Going the extra mile for them is how we earn that trust every single day.',
  },
  {
    name: 'Gbenga Onimowo', role: 'Commercial Director', org: 'HUAXIN Nigeria',
    bio: [
      'Team, every sale we make is a promise to a customer, and this week we celebrate the people who keep that promise. I am proud of how our commercial and customer experience teams work hand in hand. As we launch “The Extra Mile”, I charge each of you to see every customer interaction as an opportunity to exceed expectations — not just meet them.',
      'At Customer Service Week 2026 they deliver the #TheExtraMile Charge at the flag-off, rallying every commercial team to turn each customer interaction into an opportunity to exceed expectations.',
    ],
    quote: 'Every sale is a promise. Going the extra mile is how we keep it.',
  },
  {
    name: 'Olatunji Adeleye', role: 'Head of Customer Experience & Innovation', org: 'HUAXIN Nigeria',
    bio: [
      'Welcome to Customer Service Week 2026! Great experiences are designed, not accidental — and they are designed by you. Over these five days we will walk in each other’s shoes, launch our CX Academy, and compete in the Customer Delight Challenge. I invite everyone to join in fully, learn from one another, and together go the extra mile for every customer.',
      'The driving force behind Customer Service Week 2026, they oversee the week’s programme, including the launch of the CX Academy, the “Walk In My Shoes” job-shadowing initiative and the Customer Delight Challenge.',
    ],
    quote: 'Great experiences are designed, not accidental. This week we celebrate the people who make them happen.',
  },
]

// Drop last year's photos into public/gallery/ and list them here: [file, caption]
const gallery = [
  ['1.jpg', 'Kick-off ceremony'], ['2.jpg', 'Commitment wall'], ['3.jpg', 'Appreciation Day'],
  ['4.jpg', 'Role-play competition'], ['5.jpg', 'Awards & celebration'], ['6.jpg', 'Finale party'],
  ['7.jpg', 'Team bonding'], ['8.jpg', 'Photo booth moments'],
]

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
              <span className="mile">MILE {String(i + 1).padStart(2, '0')}</span>
              <h3>{x.d}</h3>
              <h4>{x.t}</h4>
              <p>{x.s}</p>
              {x.img && <div className="dress">{x.img.map((m) => <img key={m} src={`/dress/${m}.png`} alt={x.dress} loading="lazy" />)}</div>}
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
          {fun.map(([t, s], i) => (
            <article key={t}><FunImg i={i} t={t} /><b>0{i + 1}</b><h4>{t}</h4><p>{s}</p></article>
          ))}
        </div>
      </section>

      <section className="finale">
        <p className="eyebrow">Finale · Extra-Mile Party</p>
        <h2>Team bonding & finale party</h2>
        <p className="big">14th October · 2:00PM</p>
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
              <blockquote>“{l.quote}”</blockquote>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

function Photo({ src, cap, i }) {
  const [err, setErr] = useState(false)
  return (
    <figure className={`shot s${i % 5}`}>
      {err ? <div className="ph">CSW 2025</div> : <img src={`/gallery/${src}`} alt={cap} loading="lazy" onError={() => setErr(true)} />}
      <figcaption>{cap}</figcaption>
    </figure>
  )
}

function Gallery() {
  return (
    <>
      <section className="hero small">
        <p className="eyebrow">Memory Lane · CSW 2025</p>
        <h1>Miles <em>Behind</em> Us</h1>
        <p className="lead">Highlights from last year’s Customer Service Week — the moments that paved the road to The Extra Mile.</p>
      </section>
      <section className="wrap gallery">
        {gallery.map(([f, c], i) => <Photo key={f} src={f} cap={c} i={i} />)}
      </section>
    </>
  )
}

export default function App() {
  const route = useRoute()
  return (
    <>
      <Nav route={route} />
      <main>{({ '#/week': <Week />, '#/fun': <Fun />, '#/leaders': <Leaders />, '#/gallery': <Gallery /> })[route] || <Home />}</main>
      <footer>Customer Service Week 2026 — <b>The Extra Mile</b> · #TheExtraMile</footer>
    </>
  )
}
