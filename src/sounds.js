import { useEffect, useRef, useState } from 'react'

// Countdown sounds, generated in the browser (no audio files):
// beep every second from 10, spoken numbers from 5, bell at 0.
let ctx = null
export function unlockAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance('')) // primes speech on iOS
  } catch { /* audio unsupported */ }
}

function tone(freq, start, dur, vol = 0.25, type = 'sine') {
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = type; o.frequency.value = freq
  g.gain.setValueAtTime(vol, start)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  o.connect(g).connect(ctx.destination)
  o.start(start); o.stop(start + dur + 0.05)
}

function ensure() { if (!ctx) unlockAudio(); else if (ctx.state === 'suspended') ctx.resume(); return !!ctx }

function beep(high) { if (ensure()) tone(high ? 1320 : 880, ctx.currentTime, 0.18, 0.3, 'square') }

function bell() {
  if (!ensure()) return
  const t = ctx.currentTime
  // A bright bell: fundamental + inharmonic partials, struck twice
  ;[0, 0.55].forEach((d) => [[660, 0.35], [1320, 0.18], [1980, 0.1], [2640, 0.07], [3740, 0.04]]
    .forEach(([f, v]) => tone(f, t + d, 2.4, v)))
}

function say(n) {
  try {
    const s = window.speechSynthesis
    if (!s) return
    const words = ['zero', 'one', 'two', 'three', 'four', 'five']
    const u = new SpeechSynthesisUtterance(words[n] || String(n))
    const v = s.getVoices().find((x) => /^en(-|_)/i.test(x.lang))
    if (v) u.voice = v
    u.lang = 'en-GB'; u.rate = 0.95; u.pitch = 1; u.volume = 1
    s.speak(u)
  } catch { /* speech unsupported */ }
}

// Speech takes ~0.4s to start, so each number is spoken this much before it appears
const LEAD = 0.45
try { window.speechSynthesis?.getVoices() } catch { /* warm up voice list */ }

// Beeps 10→6 and bell at 0 (on each tick of `left`); voice 5→1 timed from `exact` (fractional seconds left).
// Returns `ringing` (true for ~3s at zero) so screens can show the big bell; it shows even when muted.
export function useCountdownSounds(left, on, exact = null) {
  const prev = useRef(left)
  const spoken = useRef(new Set())
  const [ringing, setRinging] = useState(false)
  useEffect(() => {
    if (exact === null || exact > 6) { spoken.current.clear(); return }
    if (!on) return
    for (let n = 5; n >= 1; n--) {
      if (exact <= n + LEAD && exact > n - 0.5 && !spoken.current.has(n)) { spoken.current.add(n); say(n) }
    }
  }, [exact, on])
  useEffect(() => {
    const p = prev.current
    prev.current = left
    if (left === null || p === null || left >= p) return
    if (left === 0) {
      setRinging(true); setTimeout(() => setRinging(false), 3200)
      if (on) bell()
    } else if (on && left <= 10 && left > 5) beep(false)
  }, [left, on])
  return ringing
}
