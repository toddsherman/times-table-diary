import '@fontsource/chewy/latin-400.css'
import '@fontsource/patrick-hand/latin-400.css'
// Fonts for the other themes. Each loads only when a theme (or its picker tile) uses it.
import '@fontsource/barlow/latin-500.css'
import '@fontsource/barlow/latin-700.css'
import '@fontsource/bungee/latin-400.css'
import '@fontsource/fredoka/latin-500.css'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/lilita-one/latin-400.css'
import '@fontsource/m-plus-rounded-1c/latin-500.css'
import '@fontsource/m-plus-rounded-1c/latin-800.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import '@fontsource/shojumaru/latin-400.css'
import '@fontsource/titan-one/latin-400.css'
import './styles.css'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { ErrorScreen } from './components/ErrorScreen'
import { GrownUpsLazy } from './screens/GrownUpsLazy'
import { installTapMotion } from './motion'
import { unlockAudio } from './sound'

registerSW({ immediate: true })

// An empty touchstart listener lets :active styles show on iOS; the first tap also wakes up audio.
document.addEventListener('touchstart', () => {}, { passive: true })
document.addEventListener('pointerdown', unlockAudio)
installTapMotion()

const grownUps = new URLSearchParams(location.search).has('grownups')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorScreen>
      {grownUps ? (
        <Suspense fallback={null}>
          <GrownUpsLazy />
        </Suspense>
      ) : (
        <App />
      )}
    </ErrorScreen>
  </StrictMode>,
)
