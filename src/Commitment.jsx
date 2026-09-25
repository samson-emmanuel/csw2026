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
  const [user, setUser] = useState(() => store.get('gw-user'))
  const [modal, setModal] = useState(null)
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [myP, setMyP] = useState(null) // { pledge, approved } — includes pending

  useEffect(() => {
    if (db && user) db.rpc('my_pledge', { p_email: user.email, p_code: user.code }).then(({ data }) => setMyP(data?.[0] || null))
  }, [user])

  if (!db) return <section className="wrap"><div className="gw-empty">The Commitment Wall isn’t connected yet.</div></section>

  const live = user && pledges.find((p) => p.name === user.name)
  const mine = myP && { ...myP, mile: live?.mile }
  const open = () => { setErr(''); setText(mine ? mine.pledge : ''); setModal(user ? 'pledge' : 'login') }

  const login = async (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    const email = f.get('email'), code = f.get('code')
    setBusy(true)
    const { data, error } = await db.rpc('login', { p_email: email, p_code: code })
    setBusy(false)
    if (error || !data) return setErr('Email or passcode is incorrect.')
    const u = { email, code, name: data }
    store.set('gw-user', u); setUser(u); setErr('')
    const { data: mp } = await db.rpc('my_pledge', { p_email: email, p_code: code })
    setMyP(mp?.[0] || null); setText(mp?.[0]?.pledge || ''); setModal('pledge')
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await db.rpc('save_pledge', { p_email: user.email, p_code: user.code, p_pledge: text })
    setBusy(false)
    if (error) return setErr(error.message)
    setMyP({ pledge: text.trim(), approved: false })
    setModal(null)
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
        <div className="wrap pledge-wait"><div>⏳ Thanks, {user.name.split(' ')[0]}! Your pledge <b>“{mine.pledge}”</b> is awaiting admin approval and will appear on the wall soon.</div></div>
      )}
      <section className="wrap">
        <div className="gw-bar">
          <input placeholder="Find a colleague’s pledge…" value={q} onChange={(e) => setQ(e.target.value)} />
          {user && <span>Signed in as <b>{user.name}</b> <button onClick={() => { store.set('gw-user', null); setUser(null) }}>Sign out</button></span>}
        </div>
        {shown.length ? <div className="signs">{shown.map((p) => <PledgeSign key={p.id} p={p} />)}</div>
          : <div className="gw-empty">{q ? 'No pledge found for that name.' : 'No pledges yet — be the first to commit!'}</div>}
      </section>

      {modal && (
        <div className="gw-modal" onClick={() => !busy && setModal(null)}>
          {modal === 'login' ? (
            <form className="gw-card" onClick={(e) => e.stopPropagation()} onSubmit={login}>
              <h3>Sign in to pledge</h3>
              <p>Use the email and passcode sent to you by the CX team.</p>
              <input name="email" type="email" placeholder="Email address" required />
              <input name="code" placeholder="Passcode" required autoComplete="off" />
              {err && <div className="gw-err">{err}</div>}
              <button className="btn" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</button>
            </form>
          ) : (
            <form className="pledge-card" onClick={(e) => e.stopPropagation()} onSubmit={save}>
              <div className="sign-face">
                <span className="sign-mile">{mine?.mile ? `MILE ${mine.mile}` : 'YOUR PLEDGE'}</span>
                <h4>{user.name}</h4>
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
