import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PledgeSign } from './Commitment.jsx'

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
    <section className="wrap admin">
      <form className="gw-card" onSubmit={unlock}>
        <h3>Admin</h3>
        <input name="admin" type="password" placeholder="Admin passcode" required />
        {msg && <div className="gw-err">{msg}</div>}
        <button className="btn">Unlock</button>
      </form>
    </section>
  )

  return (
    <section className="wrap admin">
      <div className="gw-bar"><h2>Gratitude Wall Admin</h2><button onClick={() => { store.set('gw-admin', null); setCode(null) }}>Lock</button></div>
      <form className="admin-add" onSubmit={onAdd}>
        <input name="name" placeholder="Full name" required />
        <input name="email" type="email" placeholder="Email address" required />
        <button className="btn" disabled={busy}>{busy ? 'Working…' : env.VITE_EMAILJS_SERVICE_ID ? 'Register & send passcode' : 'Register & get passcode'}</button>
      </form>
      {msg && (typeof msg === 'string' ? <div className="admin-msg">{msg}</div> : (
        <div className="admin-msg">
          <b>{msg.name}</b> · {msg.email}<br />
          Passcode: <code className="pass">{msg.pass}</code>
          {(() => {
            const sub = encodeURIComponent('Your CSW 2026 Gratitude Wall passcode')
            const body = encodeURIComponent(`Hi ${msg.name},

You can now post appreciation notes on the CSW 2026 Gratitude Wall.

Email: ${msg.email}
Passcode: ${msg.pass}

Sign in here: ${window.location.origin}/#/gratitude

Thank you for going the extra mile!`)
            const to = encodeURIComponent(msg.email)
            return (
              <>
                <a className="mail-btn" target="_blank" rel="noreferrer" href={`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${sub}&body=${body}`}>✉ Gmail</a>
                <a className="mail-btn alt" target="_blank" rel="noreferrer" href={`https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${sub}&body=${body}`}>Outlook</a>
                <a className="mail-btn alt" href={`mailto:${msg.email}?subject=${sub}&body=${body}`}>Email app</a>
              </>
            )
          })()}
          <button className={copied ? 'copied' : ''} onClick={() => copy(`Hi ${msg.name}, your CSW Gratitude Wall login:
Email: ${msg.email}
Passcode: ${msg.pass}
${window.location.origin}/#/gratitude`)}>{copied ? '✓ Copied' : 'Copy message'}</button>
          <div className="admin-note">{msg.sent ? 'Also emailed automatically.' : 'Send this to them yourself (WhatsApp, Teams or email). It can’t be shown again; use “Reset” to issue a new one.'}</div>
        </div>
      ))}
      <h3 className="admin-h">Staff ({staff.length})</h3>
      <div className="admin-list">
        {staff.map((s) => (
          <div key={s.id}><b>{s.name}</b><span>{s.email}</span>
            <button onClick={() => add(s.name, s.email)} disabled={busy}>Reset passcode</button>
            <button onClick={() => remove(s)}>Remove</button>
          </div>
        ))}
      </div>
      <h3 className="admin-h">Photos ({photos.filter((p) => !p.approved).length} awaiting approval)</h3>
      <div className="admin-photos">
        {photos.map((p) => (
          <figure key={p.id} className={p.approved ? '' : 'pending'}>
            <img src={`https://drive.google.com/thumbnail?id=${p.drive_id}&sz=w400`} alt="" loading="lazy" referrerPolicy="no-referrer" />
            <figcaption><b>{p.day}</b> · {p.uploader}{p.caption && <> · {p.caption}</>}</figcaption>
            <div>
              <button onClick={() => setPhoto(p.id, !p.approved)}>{p.approved ? 'Unapprove' : 'Approve'}</button>
              <button onClick={() => delPhoto(p.id)}>Delete</button>
            </div>
          </figure>
        ))}
      </div>
      <h3 className="admin-h">Pledges ({pledges.filter((p) => !p.approved).length} awaiting approval)</h3>
      <div className="signs">{pledges.map((p) => <PledgeSign key={p.id} p={p} onApprove={setPledge} onDelete={delPledge} />)}</div>
      <h3 className="admin-h">Notes ({notes.length})</h3>
      <div className="wall">{notes.map((n) => <Note key={n.id} n={n} onDelete={delNote} />)}</div>
    </section>
  )
}
