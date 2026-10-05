import { useCallback, useEffect, useState } from 'react'
import { db, store } from './Gratitude.jsx'

const SUGGESTIONS = [
  'responding to every customer within one hour',
  'following up until every issue is fully resolved',
  'greeting every customer by name with a smile',
  'owning every complaint I receive from start to finish',
  'sharing one idea to improve our customer experience',
  'helping a teammate whenever they are stretched',
]
const LEAD = 'This week, I will go the extra mile by'

export function usePledges() {
  const [pledges, setPledges] = useState([])
  const load = useCallback(async () => {
    const { data } = await db.from('pledges').select('*').order('created_at', { ascending: true })
    // Mile number = order the pledge was first made
    setPledges((data || []).map((p, i) => ({ ...p, mile: i + 1 })).reverse())
  }, [])
  useEffect(() => {
    if (!db) return
    load()
    const ch = db.channel('pledges').on('postgres_changes', { event: '*', schema: 'public', table: 'pledges' }, load).subscribe()
    return () => { db.removeChannel(ch) }
  }, [load])
  return [pledges, load]
}

export function PledgeSign({ p, onDelete, onApprove }) {
  return (
    <article className={`sign ${p.approved === false ? 'pending' : ''}`}>
      <div className="sign-face">
        <span className="sign-mile">MILE {p.mile}</span>
        <h4>{p.name}</h4>
        <p>{p.pledge}</p>
      </div>
      <div className="sign-posts" />
      {(onDelete || onApprove) && (
        <div className="sign-admin">
          {onApprove && <button className={p.approved ? '' : 'go'} onClick={() => onApprove(p.id, !p.approved)}>{p.approved ? 'Unapprove' : 'Approve'}</button>}
          {onDelete && <button onClick={() => onDelete(p.id)}>Delete</button>}
        </div>
      )}
    </article>
  )
}

export function Commitment() {
  const [pledges] = usePledges()
  // No sign-in: the pledger types their name; this device remembers their own pledge
  const [name, setName] = useState(() => { try { return localStorage.getItem('cw-name') || store.get('gw-user')?.name || '' } catch { return '' } })
  const [modal, setModal] = useState(null)
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [myP, setMyP] = useState(() => { try { return JSON.parse(localStorage.getItem('cw-mine')) } catch { return null } })

  if (!db) return <section className="wrap"><div className="gw-empty">The Commitment Wall isn’t connected yet.</div></section>

  const live = myP && pledges.find((p) => p.name.toLowerCase() === myP.name.toLowerCase())
  const mine = myP && { ...myP, approved: !!live && live.pledge === myP.pledge, mile: live?.mile }
  const open = () => { setErr(''); setText(mine ? mine.pledge : ''); setModal('pledge') }

  const save = async (e) => {
    e.preventDefault()
    if (name.trim().length < 2) return setErr('Please enter your name.')
    setBusy(true)
    const { error } = await db.rpc('save_pledge_open', { p_name: name.trim(), p_pledge: text })
    setBusy(false)
    if (error) return setErr(error.message)
    const m = { name: name.trim(), pledge: text.trim() }
    try { localStorage.setItem('cw-name', m.name); localStorage.setItem('cw-mine', JSON.stringify(m)) } catch { /* private mode */ }
    setMyP(m); setModal(null)
  }

  const shown = q ? pledges.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : pledges

  return (
    <>
      <section className="hero small">
        <p className="eyebrow">Commitment Wall</p>
        <h1>Make Your <em>Pledge</em></h1>
        <p className="lead">{LEAD}… Add your promise to the road — it stays up all week as a shared reminder.</p>
        <div className="pledge-count"><b>{pledges.length}</b> pledge{pledges.length === 1 ? '' : 's'} and counting</div>
        <button className="btn" onClick={open}>{mine ? '✎ Edit my pledge' : '+ Make my pledge'}</button>
      </section>
      {mine && !mine.approved && (
        <div className="wrap pledge-wait"><div>⏳ Thanks, {mine?.name.split(' ')[0]}! Your pledge <b>“{mine.pledge}”</b> is awaiting admin approval and will appear on the wall soon.</div></div>
      )}
      <section className="wrap">
        <div className="gw-bar">
          <input placeholder="Find a colleague’s pledge…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {shown.length ? <div className="signs">{shown.map((p) => <PledgeSign key={p.id} p={p} />)}</div>
          : <div className="gw-empty">{q ? 'No pledge found for that name.' : 'No pledges yet — be the first to commit!'}</div>}
      </section>

      {modal && (
        <div className="gw-modal" onClick={() => !busy && setModal(null)}>
          {(
            <form className="pledge-card" onClick={(e) => e.stopPropagation()} onSubmit={save}>
              <div className="sign-face">
                <span className="sign-mile">{mine?.mile ? `MILE ${mine.mile}` : 'YOUR PLEDGE'}</span>
                <input className="pledge-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="YOUR NAME" maxLength={60} required autoFocus />
                <p className="pledge-lead">{LEAD}…</p>
                <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={200} rows={3} placeholder="…finish the sentence" required />
                <small>{200 - text.length} characters left{mine?.approved ? ' · editing sends it for approval again' : ''}</small>
              </div>
              <div className="pledge-sugs">
                <span>Need inspiration?</span>
                {SUGGESTIONS.map((s) => <button type="button" key={s} onClick={() => setText(s)}>{s}</button>)}
              </div>
              {err && <div className="gw-err">{err}</div>}
              <button className="btn" disabled={busy || text.trim().length < 3}>{busy ? 'Saving…' : mine ? 'Update my pledge' : 'Commit to the Extra Mile'}</button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
