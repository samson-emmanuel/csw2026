import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Big screens (TVs, projectors): scale the whole design up from a 1440px-wide layout so it fills any screen.
// --zh lets full-height sections divide by the zoom, so they still fit the screen exactly.
const BASE = 1440
function fitScreen() {
  const z = Math.max(1, Math.min(window.innerWidth / BASE, window.innerHeight / 800)) // tighter of width/height, so ultra-wide screens fit too
  const root = document.documentElement
  root.style.zoom = z > 1.02 ? String(z) : ''
  root.style.setProperty('--zh', z > 1.02 ? String(z) : '1')
}
fitScreen()
window.addEventListener('resize', fitScreen)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
