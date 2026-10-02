import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ScoreAdmin } from './Scoreboard.jsx'

const env = import.meta.env
export const db = env.VITE_SUPABASE_URL ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY) : null
const COLORS = ['yellow', 'pink', 'blue', 'green']

export const store = {
  get: (k) => { try { return JSON.parse(sessionStorage.getItem(k)) } catch { return null } },
  set: (k, v) => { try { v ? sessionStorage.setItem(k, JSON.stringify(v)) : sessionStorage.removeItem(k) } catch { /* private mode */ } },
}

// Sends the passcode email via EmailJS (template params: to_name, to_email, passcode, site_url)
async function sendPasscode(name, email, passcode) {
  if (!env.VITE_EMAILJS_SERVICE_ID) return false
  const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: env.VITE_EMAILJS_SERVICE_ID, template_id: env.VITE_EMAILJS_TEMPLATE_ID, user_id: env.VITE_EMAILJS_PUBLIC_KEY,
      template_params: { to_name: name, to_email: email, passcode, site_url: `${window.location.origin}/#/gratitude` },
    }),
  })
  return r.ok
}

function Setup() {
  return <section className="wrap"><div className="gw-empty">The Gratitude Wall isn’t connected yet. Add the Supabase keys to <code>.env</code> and restart the site.</div></section>
}

function Note({ n, onDelete }) {
  const tilt = ((n.id.charCodeAt(0) + n.id.charCodeAt(1)) % 7) - 3
  return (
    <article className={`sticky ${n.color}`} style={{ '--r': `${tilt}deg` }}>
      <span className="pin" />
      <h4>{n.to_name}</h4>
      <p>{n.message}</p>
      <small>— {n.from_name || 'Anonymous'}</small>
      {onDelete && <button className="note-del" onClick={() => onDelete(n.id)}>Delete</button>}
    </article>
  )
}

function useNotes() {
  const [notes, setNotes] = useState([])
  const load = useCallback(async () => {
    const { data } = await db.from('notes').select('*').order('created_at', { ascending: false })
    setNotes(data || [])
  }, [])
  useEffect(() => {
    if (!db) return
    load()
    const ch = db.channel('notes').on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, load).subscribe()
    return () => { db.removeChannel(ch) }
  }, [load])
  return [notes, load]
}

export function Gratitude() {
  const [notes] = useNotes()
  const [names, setNames] = useState([])
  const [user, setUser] = useState(() => store.get('gw-user'))
  const [modal, setModal] = useState(null)
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ to: '', message: '', color: 'yellow', anon: false })

  useEffect(() => { if (db) db.rpc('staff_names').then(({ data }) => setNames((data || []).map((d) => d.name))) }, [])
  if (!db) return <Setup />

  const open = () => { setErr(''); setModal(user ? 'note' : 'login') }
  const close = () => { setModal(null); setErr('') }

  const login = async (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const email = f.get('email'), code = f.get('code')
    setBusy(true)
    const { data, error } = await db.rpc('login', { p_email: email, p_code: code })
    setBusy(false)
    if (error || !data) return setErr('Email or passcode is incorrect.')
    const u = { email, code, name: data }
    store.set('gw-user', u); setUser(u); setErr(''); setModal('note')
  }

  const post = async (e) => {
    e.preventDefault()
    if (!names.includes(form.to)) return setErr('Please pick a name from the staff list.')
    setBusy(true)
    const { error } = await db.rpc('post_note', { p_email: user.email, p_code: user.code, p_to: form.to, p_message: form.message, p_color: form.color, p_anon: form.anon })
    setBusy(false)
    if (error) return setErr(error.message)
    setForm({ to: '', message: '', color: 'yellow', anon: false }); close()
  }

  const shown = q ? notes.filter((n) => n.to_name.toLowerCase().includes(q.toLowerCase())) : notes

  return (
    <>
      <section className="hero small">
        <p className="eyebrow">Gratitude Wall</p>
        <h1>Say <em>Thank You</em></h1>
        <p className="lead">Appreciate a colleague who went the extra mile. Every note lands on the wall for everyone to see.</p>
        <button className="btn" onClick={open}>+ Give Appreciation</button>
      </section>
      <section className="wrap">
        <div className="gw-bar">
          <input placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} />
          <span>{notes.length} notes{user && <> · Signed in as <b>{user.name}</b> <button onClick={() => { store.set('gw-user', null); setUser(null) }}>Sign out</button></>}</span>
        </div>
        {shown.length ? <div className="wall">{shown.map((n) => <Note key={n.id} n={n} />)}</div>
          : <div className="gw-empty">{q ? 'No notes for that name yet.' : 'No notes yet — be the first to say thank you!'}</div>}
      </section>

      {modal && (
        <div className="gw-modal" onClick={close}>
          {modal === 'login' ? (
            <form className="gw-card" onClick={(e) => e.stopPropagation()} onSubmit={login}>
              <h3>Sign in to post</h3>
              <p>Use the email and passcode sent to you by the CX team.</p>
              <input name="email" type="email" placeholder="Email address" required />
              <input name="code" placeholder="Passcode" required autoComplete="off" />
              {err && <div className="gw-err">{err}</div>}
              <button className="btn" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</button>
            </form>
          ) : (
            <form className={`sticky compose ${form.color}`} onClick={(e) => e.stopPropagation()} onSubmit={post}>
              <span className="pin" />
              <label>To</label>
              <input className="to" list="gw-names" placeholder="Colleague’s name" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} required />
              <datalist id="gw-names">{names.map((n) => <option key={n} value={n} />)}</datalist>
              <textarea placeholder="Write your appreciation…" maxLength={280} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              <div className="compose-row">
                <div className="swatches">{COLORS.map((c) => <button type="button" key={c} className={`sw ${c} ${form.color === c ? 'on' : ''}`} onClick={() => setForm({ ...form, color: c })} aria-label={c} />)}</div>
                <label className="anon"><input type="checkbox" checked={form.anon} onChange={(e) => setForm({ ...form, anon: e.target.checked })} /> Anonymous</label>
              </div>
              <small>{form.anon ? '— Anonymous' : `— ${user.name}`} · {280 - form.message.length} left</small>
              {err && <div className="gw-err">{err}</div>}
              <button className="btn" disabled={busy}>{busy ? 'Sticking…' : 'Stick it on the wall'}</button>
            </form>
          )}
        </div>
      )}
    </>
  )
}

export function Admin() {
  const [code, setCode] = useState(() => store.get('gw-admin'))
  const [staff, setStaff] = useState([])
  const [notes, reload] = useNotes()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState('approve')
  const [qFilter, setQFilter] = useState('pending')
  const [staffQ, setStaffQ] = useState('')

  // Clipboard API with a fallback for browsers/contexts that block it
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text) } catch {
      const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove()
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const loadStaff = useCallback(async (c) => {
    const { data, error } = await db.rpc('admin_list_staff', { p_admin: c })
    if (error) { store.set('gw-admin', null); setCode(null); setMsg('Wrong admin passcode.'); return }
    setStaff(data)
  }, [])
  const [pledges, setPledges] = useState([])
  const loadPledges = useCallback(async (c) => {
    const { data } = await db.rpc('admin_list_pledges', { p_admin: c })
    setPledges((data || []).map((p, i) => ({ ...p, mile: i + 1 })))
  }, [])
  useEffect(() => { if (db && code) loadPledges(code) }, [code, loadPledges])
  const setPledge = async (id, ok) => { await db.rpc('admin_set_pledge', { p_admin: code, p_id: id, p_approved: ok }); loadPledges(code) }
  const delPledge = async (id) => { if (!confirm('Delete this pledge?')) return; await db.rpc('admin_delete_pledge', { p_admin: code, p_id: id }); loadPledges(code) }
  const [photos, setPhotos] = useState([])
  const loadPhotos = useCallback(async (c) => {
    const { data } = await db.rpc('admin_list_photos', { p_admin: c })
    setPhotos(data || [])
  }, [])
  useEffect(() => { if (db && code) { loadStaff(code); loadPhotos(code) } }, [code, loadStaff, loadPhotos])
  const setPhoto = async (id, ok) => { await db.rpc('admin_set_photo', { p_admin: code, p_id: id, p_approved: ok }); loadPhotos(code) }
  const delPhoto = async (id) => { if (!confirm('Remove this photo from the site? (The file stays in your Drive.)')) return; await db.rpc('admin_delete_photo', { p_admin: code, p_id: id }); loadPhotos(code) }
  // Keep the approval queues fresh without a refresh
  useEffect(() => {
    if (!db || !code) return
    const i = setInterval(() => { loadPhotos(code); loadPledges(code) }, 20000)
    return () => clearInterval(i)
  }, [code, loadPhotos, loadPledges])
  if (!db) return <Setup />

  const unlock = (e) => { e.preventDefault(); const c = new FormData(e.target).get('admin'); store.set('gw-admin', c); setMsg(''); setCode(c) }

  const add = async (name, email) => {
    setBusy(true)
    const { data: pass, error } = await db.rpc('admin_add_staff', { p_admin: code, p_name: name, p_email: email })
    if (error) { setBusy(false); return setMsg(error.message) }
    const sent = await sendPasscode(name, email, pass).catch(() => false)
    setBusy(false)
    setMsg({ name, email, pass, sent })
    loadStaff(code)
  }

  const onAdd = (e) => { e.preventDefault(); const f = new FormData(e.target); add(f.get('name'), f.get('email')); e.target.reset() }
  const remove = async (s) => { if (!confirm(`Remove ${s.name}?`)) return; await db.rpc('admin_remove_staff', { p_admin: code, p_id: s.id }); loadStaff(code) }
  const delNote = async (id) => { if (!confirm('Delete this note?')) return; await db.rpc('admin_delete_note', { p_admin: code, p_id: id }); reload() }

  if (!code) return (
    <section className="adm-lock">
      <form className="adm-lock-card" onSubmit={unlock}>
        <img src="/logo.png" alt="" />
        <h3>Admin dashboard</h3>
        <p>Enter the admin passcode to manage staff, approvals and scores.</p>
        <input name="admin" type="password" placeholder="Admin passcode" required autoFocus />
        {msg && <div className="gw-err">{msg}</div>}
        <button className="btn">Unlock</button>
      </form>
    </section>
  )

  const pendPhotos = photos.filter((p) => !p.approved)
  const pendPledges = pledges.filter((p) => !p.approved)
  const shownPhotos = qFilter === 'pending' ? pendPhotos : photos.filter((p) => p.approved)
  const shownPledges = qFilter === 'pending' ? pendPledges : pledges.filter((p) => p.approved)
  const shownStaff = staffQ ? staff.filter((x) => `${x.name} ${x.email}`.toLowerCase().includes(staffQ.toLowerCase())) : staff
  const TABS = [
    ['approve', '✅', 'Approvals', pendPhotos.length + pendPledges.length],
    ['scores', '🏆', 'Scores', 0],
    ['staff', '👥', 'Staff', 0],
    ['notes', '💌', 'Notes', 0],
  ]

  return (
    <div className="adm">
      <header className="adm-head">
        <div className="adm-title">
          <div><small>CSW 2026</small><h2>Admin dashboard</h2></div>
          <button className="adm-lock-btn" onClick={() => { store.set('gw-admin', null); setCode(null) }}>🔒 Lock</button>
        </div>
        <div className="adm-stats">
          <button onClick={() => { setTab('approve'); setQFilter('pending') }} className={pendPhotos.length ? 'hot' : ''}><b>{pendPhotos.length}</b><span>Photos to review</span></button>
          <button onClick={() => { setTab('approve'); setQFilter('pending') }} className={pendPledges.length ? 'hot' : ''}><b>{pendPledges.length}</b><span>Pledges to review</span></button>
          <button onClick={() => setTab('staff')}><b>{staff.length}</b><span>Staff registered</span></button>
          <button onClick={() => setTab('notes')}><b>{notes.length}</b><span>Gratitude notes</span></button>
        </div>
        <div className="adm-links">
          <a href="#/timer">⏱ Challenge timer</a>
          <a href="#/scoreboard" target="_blank" rel="noreferrer">📺 Open scoreboard</a>
        </div>
      </header>

      <nav className="adm-tabs">
        {TABS.map(([k, ic, l, n]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            <i>{ic}</i><span>{l}</span>{n > 0 && <em>{n}</em>}
          </button>
        ))}
      </nav>

      <main className="adm-body">
        {tab === 'approve' && (
          <>
            <div className="adm-seg">
              <button className={qFilter === 'pending' ? 'on' : ''} onClick={() => setQFilter('pending')}>Waiting ({pendPhotos.length + pendPledges.length})</button>
              <button className={qFilter === 'approved' ? 'on' : ''} onClick={() => setQFilter('approved')}>Approved</button>
            </div>

            <section className="adm-card">
              <h3>Photos <span>{shownPhotos.length}</span></h3>
              {shownPhotos.length ? (
                <div className="adm-photos">
                  {shownPhotos.map((p) => (
                    <figure key={p.id}>
                      <a href={`https://drive.google.com/file/d/${p.drive_id}/view`} target="_blank" rel="noreferrer">
                        <img src={`https://drive.google.com/thumbnail?id=${p.drive_id}&sz=w500`} alt="" loading="lazy" referrerPolicy="no-referrer" />
                      </a>
                      <figcaption><b>{p.day}</b>{p.uploader}{p.caption && <i>“{p.caption}”</i>}</figcaption>
                      <div className="adm-act">
                        <button className={p.approved ? '' : 'yes'} onClick={() => setPhoto(p.id, !p.approved)}>{p.approved ? 'Hide' : '✓ Approve'}</button>
                        <button className="no" onClick={() => delPhoto(p.id)}>✕</button>
                      </div>
                    </figure>
                  ))}
                </div>
              ) : <div className="adm-empty">{qFilter === 'pending' ? '🎉 No photos waiting.' : 'No approved photos yet.'}</div>}
            </section>

            <section className="adm-card">
              <h3>Pledges <span>{shownPledges.length}</span></h3>
              {shownPledges.length ? (
                <div className="adm-pledges">
                  {shownPledges.map((p) => (
                    <div key={p.id} className="adm-pledge">
                      <div><b>{p.name}</b><p>“{p.pledge}”</p></div>
                      <div className="adm-act">
                        <button className={p.approved ? '' : 'yes'} onClick={() => setPledge(p.id, !p.approved)}>{p.approved ? 'Hide' : '✓ Approve'}</button>
                        <button className="no" onClick={() => delPledge(p.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="adm-empty">{qFilter === 'pending' ? '🎉 No pledges waiting.' : 'No approved pledges yet.'}</div>}
            </section>
          </>
        )}

        {tab === 'scores' && (
          <section className="adm-card">
            <h3>Scoreboard <span>live</span></h3>
            <ScoreAdmin code={code} />
          </section>
        )}

        {tab === 'staff' && (
          <>
            <section className="adm-card">
              <h3>Register staff</h3>
              <form className="adm-form" onSubmit={onAdd}>
                <input name="name" placeholder="Full name" required />
                <input name="email" type="email" placeholder="Email address" required />
                <button className="btn" disabled={busy}>{busy ? 'Working…' : env.VITE_EMAILJS_SERVICE_ID ? 'Register & send passcode' : 'Register & get passcode'}</button>
              </form>
              {msg && (typeof msg === 'string' ? <div className="admin-msg">{msg}</div> : (
                <div className="adm-pass">
                  <div><small>{msg.email}</small><b>{msg.name}</b></div>
                  <code>{msg.pass}</code>
                  <div className="adm-share">
                    {(() => {
                      const sub = encodeURIComponent('Your CSW 2026 Gratitude Wall passcode')
                      const body = encodeURIComponent(`Hi ${msg.name},\n\nYou can now post appreciation notes on the CSW 2026 Gratitude Wall.\n\nEmail: ${msg.email}\nPasscode: ${msg.pass}\n\nSign in here: ${window.location.origin}/#/gratitude\n\nThank you for going the extra mile!`)
                      const to = encodeURIComponent(msg.email)
                      return (
                        <>
                          <a className="mail-btn" target="_blank" rel="noreferrer" href={`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${sub}&body=${body}`}>✉ Gmail</a>
                          <a className="mail-btn alt" target="_blank" rel="noreferrer" href={`https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${sub}&body=${body}`}>Outlook</a>
                          <a className="mail-btn alt" href={`mailto:${msg.email}?subject=${sub}&body=${body}`}>Email app</a>
                          <button className={`mail-btn alt ${copied ? 'copied' : ''}`} onClick={() => copy(`Hi ${msg.name}, your CSW Gratitude Wall login:\nEmail: ${msg.email}\nPasscode: ${msg.pass}\n${window.location.origin}/#/gratitude`)}>{copied ? '✓ Copied' : 'Copy'}</button>
                        </>
                      )
                    })()}
                  </div>
                  <small className="admin-note">{msg.sent ? 'Also emailed automatically.' : 'Shown once only — share it now. Use “Reset” to issue a new one.'}</small>
                </div>
              ))}
            </section>
            <section className="adm-card">
              <h3>Staff <span>{staff.length}</span></h3>
              <input className="adm-search" placeholder="Search name or email…" value={staffQ} onChange={(e) => setStaffQ(e.target.value)} />
              <div className="adm-staff">
                {shownStaff.map((x) => (
                  <div key={x.id}>
                    <span className="team-av">{x.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                    <div><b>{x.name}</b><small>{x.email}</small></div>
                    <div className="adm-act">
                      <button onClick={() => add(x.name, x.email)} disabled={busy}>Reset</button>
                      <button className="no" onClick={() => remove(x)}>✕</button>
                    </div>
                  </div>
                ))}
                {!shownStaff.length && <div className="adm-empty">No staff found.</div>}
              </div>
            </section>
          </>
        )}

        {tab === 'notes' && (
          <section className="adm-card">
            <h3>Gratitude notes <span>{notes.length}</span></h3>
            {notes.length ? <div className="wall">{notes.map((n) => <Note key={n.id} n={n} onDelete={delNote} />)}</div> : <div className="adm-empty">No notes yet.</div>}
          </section>
        )}
      </main>
    </div>
  )
}
