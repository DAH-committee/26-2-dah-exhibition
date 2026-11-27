import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/jost/300.css'
import '@fontsource/jost/400.css'
import '@fontsource/jost/500.css'
import '@fontsource/libre-caslon-text/400.css'
import '@fontsource/noto-serif-kr/400.css'
import App from './App'
import { ExhibitionProvider } from './data/useExhibition'
import { SkyProvider } from './sky/SkyProvider'
import './index.css'
import Gate, { isUnlocked } from './Gate'

if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'

// 공개 전 잠금. 공개할 때 false로 바꾼다
const LOCKED = true

function Root() {
  const [open, setOpen] = React.useState(() => !LOCKED || isUnlocked())
  if (!open) return <Gate onUnlock={() => setOpen(true)} />
  return (
    <BrowserRouter>
      <ExhibitionProvider>
        <SkyProvider>
          <App />
        </SkyProvider>
      </ExhibitionProvider>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
