import { useEffect, useRef, useState } from 'react'
import { db, store } from './Gratitude.jsx'
import { Slideshow } from './Slideshow.jsx'

export const SNAP_DAYS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Finale']
export const driveImg = (id, w) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`
const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL
const PAGE = 12
const SHOW_SLIDESHOW = false // set to true to show the ▶ Slideshow button

// Resize in the browser (max 2560px, high-quality JPEG) so uploads are up to ~1MB instead of several MB
function shrink(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, 2560 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/jpeg', 0.9).split(',')[1])
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function Snapshots() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [show, setShow] = useState(null) // slideshow slides when playing
  const playAll = async () => {
    const { data } = await db.from('photos').select('drive_id, day, uploader, created_at').order('created_at')
    const order = (d) => SNAP_DAYS.indexOf(d)
    const list = (data || []).sort((a, b) => order(a.day) - order(b.day))
    if (list.length) setShow(list.map((p) => [driveImg(p.drive_id, 1920), `${p.day} · ${p.uploader}`]))
  }
  const [day, setDay] = useState(SNAP_DAYS[0])
  const [open, setOpen] = useState(null)
  const [name, setName] = useState(() => store.get('snap-name') || store.get('gw-user')?.name || '')
  const [modal, setModal] = useState(false)
  const [err, setErr] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState([]) // [{ file, url, state: '' | 'up' | 'done' | 'err' }]
  const [upDay, setUpDay] = useState(SNAP_DAYS[0])
  const [caption, setCaption] = useState('')

  const addFiles = (list) => {
    const imgs = [...list].filter((f) => f.type.startsWith('image/'))
    setPicked((p) => [...p, ...imgs.map((file) => ({ file, url: URL.createObjectURL(file), state: '' }))])
    setErr(''); setStatus('')
  }
  const removeFile = (i) => setPicked((p) => { URL.revokeObjectURL(p[i].url); return p.filter((_, j) => j !== i) })
  const closeModal = () => { if (busy) return; picked.forEach((p) => URL.revokeObjectURL(p.url)); setPicked([]); setModal(false) }

  // Fetch one page (newest first) for the selected day; "Load more" fetches the next page
  const loadPage = async (d, from) => {
    setLoading(true)
    const { data, count } = await db.from('photos').select('id, drive_id, day, caption, uploader, created_at', { count: 'exact' })
      .eq('day', d).order('created_at', { ascending: false }).range(from, from + PAGE - 1)
    setItems((p) => (from ? [...p, ...(data || [])] : data || []))
    setTotal(count || 0)
    setLoading(false)
  }
  const loadCounts = () => Promise.all(SNAP_DAYS.map((d) => db.from('photos').select('id', { count: 'exact', head: true }).eq('day', d)))
    .then((r) => setCounts(Object.fromEntries(r.map((x, i) => [SNAP_DAYS[i], x.count || 0]))))
  useEffect(() => { if (db) loadPage(day, 0) }, [day])
  // Live: when an admin approves/removes a photo, refresh the counts and the open day
  const dayRef = useRef(day); dayRef.current = day
  useEffect(() => {
    if (!db) return
    loadCounts()
    const ch = db.channel('photos').on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => { loadCounts(); loadPage(dayRef.current, 0) }).subscribe()
    return () => { db.removeChannel(ch) }
  }, [])

  const shown = items
  const pick = (d) => { if (d !== day) { setItems([]); setDay(d) } setOpen(null) }
  const openUpload = () => { setModal(true); setErr(''); setStatus(''); setUpDay(day) }
  const initials = (n = '') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  const upload = async () => {
    if (!picked.length) return setErr('Add at least one photo.')
    setBusy(true); setErr('')
    store.set('snap-name', name.trim() || null)
    let ok = 0, failed = false
    for (let i = 0; i < picked.length; i++) {
      if (picked[i].state === 'done') continue
      setPicked((p) => p.map((x, j) => (j === i ? { ...x, state: 'up' } : x)))
      setStatus(`Uploading ${i + 1} of ${picked.length}…`)
      let res
      try {
        const data = await shrink(picked[i].file)
        // text/plain avoids a CORS preflight, which Apps Script can't answer
        const r = await fetch(UPLOAD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ name: name.trim(), day: upDay, caption, data, type: 'image/jpeg' }) })
        res = await r.json()
      } catch { res = { ok: false, error: `Could not upload ${picked[i].file.name}.` } }
      setPicked((p) => p.map((x, j) => (j === i ? { ...x, state: res.ok ? 'done' : 'err' } : x)))
      if (!res.ok) { setErr(res.error); failed = true; break }
      ok++
    }
    setBusy(false)
    if (ok && !failed) {
      // All done: close the box and confirm with a toast
      picked.forEach((p) => URL.revokeObjectURL(p.url)); setPicked([]); setCaption(''); setStatus(''); setModal(false)
      setToast(`${ok} photo${ok > 1 ? 's' : ''} uploaded — they’ll appear once an admin approves them.`)
      setTimeout(() => setToast(''), 5000)
    } else setStatus(ok ? `${ok} uploaded. Fix the one marked red and try again.` : '')
  }

  return (
    <>
      <section className="hero small snap-hero">
        <p className="eyebrow">Snapshots · CSW 2026</p>
        <h1>Your <em>Extra Mile</em> Moments</h1>
        <p className="lead">Photos from the week, captured and shared by the team.</p>
        {db && UPLOAD_URL && <button className="btn" onClick={openUpload}>+ Share Photos</button>}
      </section>

      {show && <Slideshow slides={show} onClose={() => setShow(null)} />}
      <div className="snap-bar">
        <div className="snap-tabs">
          {SHOW_SLIDESHOW && <button className="snap-play" onClick={playAll}>▶ Slideshow</button>}
          {SNAP_DAYS.map((d) => (
            <button key={d} className={day === d ? 'on' : ''} onClick={() => pick(d)}>
              {d}{counts[d] ? <i>{counts[d]}</i> : null}
            </button>
          ))}
        </div>
      </div>

      <section className="wrap snap-wrap">
        {shown.length ? (
          <div className="snap-grid">
            {shown.map((p, i) => (
              <figure key={p.id} className="snap-tile" onClick={() => setOpen(i)} style={{ '--d': `${(i % PAGE) * 40}ms` }}>
                <img src={driveImg(p.drive_id, 800)} alt={p.caption || p.day} loading="lazy" referrerPolicy="no-referrer" />
                <figcaption>
                  {p.caption && <b>{p.caption}</b>}
                  <span><i className="av">{initials(p.uploader)}</i>{p.uploader}</span>
                </figcaption>
              </figure>
            ))}
            {loading && Array.from({ length: 4 }, (_, i) => <div key={`sk${i}`} className="snap-tile sk" />)}
          </div>
        ) : loading ? (
          <div className="snap-grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className={`snap-tile sk ${i === 0 ? 'feature' : ''}`} />)}</div>
        ) : (
          <div className="snap-empty">
            <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            <h3>No photos for {day} yet</h3>
            <p>Be the first to share a moment from {day}.</p>
            {db && UPLOAD_URL && <button className="btn" onClick={openUpload}>+ Share Photos</button>}
          </div>
        )}
        {shown.length > 0 && shown.length < total && (
          <div className="g-more">
            <button onClick={() => loadPage(day, shown.length)} disabled={loading}>{loading ? 'Loading…' : 'Load more'}</button>
            <span>Showing {shown.length} of {total}</span>
          </div>
        )}
      </section>

      {db && UPLOAD_URL && <button className="snap-fab" onClick={openUpload} aria-label="Share photos">+</button>}
      {toast && <div className="snap-toast">✓ {toast}</div>}

      {open !== null && shown[open] && (
        <div className="lightbox" onClick={() => setOpen(null)}>
          <button className="lb-nav prev" onClick={(e) => { e.stopPropagation(); setOpen((open + shown.length - 1) % shown.length) }}>‹</button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={driveImg(shown[open].drive_id, 1600)} alt={shown[open].caption || ''} referrerPolicy="no-referrer" />
            <figcaption>{shown[open].caption || shown[open].day} · {shown[open].uploader} <span>{open + 1} / {shown.length}</span></figcaption>
          </figure>
          <button className="lb-nav next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % shown.length) }}>›</button>
          <button className="lb-close" onClick={() => setOpen(null)}>✕</button>
        </div>
      )}

      {modal && (
        <div className="gw-modal" onClick={closeModal}>
          {(
            <div className="up-card" onClick={(e) => e.stopPropagation()}>
              <div className="up-head">
                <div><h3>Share photos</h3><p>Photos appear once an admin approves them.</p></div>
                <button className="up-x" onClick={closeModal} aria-label="Close">✕</button>
              </div>

              <label className="up-label">Your name <i>(optional)</i></label>
              <input className="up-caption up-name" placeholder="e.g. Ada Obi" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />

              <label className="up-label">Which day?</label>
              <div className="up-days">{SNAP_DAYS.map((d) => <button type="button" key={d} className={upDay === d ? 'on' : ''} onClick={() => setUpDay(d)}>{d}</button>)}</div>

              <div className={`up-drop ${picked.length ? 'has' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}>
                {picked.length ? (
                  <div className="up-previews">
                    {picked.map((p, i) => (
                      <div key={p.url} className={`up-thumb ${p.state}`}>
                        <img src={p.url} alt="" />
                        {p.state === 'up' && <span className="up-badge"><i className="spin" /></span>}
                        {p.state === 'done' && <span className="up-badge ok">✓</span>}
                        {p.state === 'err' && <span className="up-badge bad">!</span>}
                        {!busy && p.state !== 'done' && <button className="up-rm" onClick={() => removeFile(i)} aria-label="Remove">✕</button>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="up-empty"><span>📷</span><b>Add your photos</b><small>Take a picture or choose from your gallery · drag &amp; drop works too</small></div>
                )}
                <div className="up-actions">
                  <label className="up-pick">
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} hidden />
                    <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                    Take photo
                  </label>
                  <label className="up-pick">
                    <input type="file" accept="image/*" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} hidden />
                    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>
                    Gallery
                  </label>
                </div>
              </div>

              <input className="up-caption" placeholder="Add a caption (optional)" maxLength={80} value={caption} onChange={(e) => setCaption(e.target.value)} />
              {err && <div className="gw-err">{err}</div>}
              {status && <div className="snap-status">{status}</div>}
              <button className="btn up-go" disabled={busy || !picked.some((p) => p.state !== 'done')} onClick={upload}>
                {busy ? 'Uploading…' : `Upload ${picked.filter((p) => p.state !== 'done').length || ''} photo${picked.length === 1 ? '' : 's'}`}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
