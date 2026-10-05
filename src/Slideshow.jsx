import { useCallback, useEffect, useState } from 'react'

// Full-screen animated slideshow. slides = [[imageUrl, label], ...]
export function Slideshow({ slides, onClose }) {
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
  const [src, label] = slides[i]
  return (
    <div className="slides">
      {prev !== null && prev !== i && <img key={`out-${slides[prev][0]}`} className={`slide-img out fx${prev % 3}`} src={slides[prev][0]} alt="" referrerPolicy="no-referrer" />}
      <div key={`in-${src}`} className={`slide-frame in fx${i % 3}`}><img className="slide-img kb" src={src} alt={label} referrerPolicy="no-referrer" /></div>
      <img className="slide-pre" src={slides[(i + 1) % slides.length][0]} alt="" referrerPolicy="no-referrer" />
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
