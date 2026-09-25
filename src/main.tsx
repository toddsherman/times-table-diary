import '@fontsource/chewy/latin-400.css'
import '@fontsource/patrick-hand/latin-400.css'
import './styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { unlockAudio } from './sound'

registerSW({ immediate: true })

// An empty touchstart listener lets :active styles show on iOS; the first tap also wakes up audio.
document.addEventListener('touchstart', () => {}, { passive: true })
document.addEventListener('pointerdown', unlockAudio)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
