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

if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ExhibitionProvider>
        <SkyProvider>
          <App />
        </SkyProvider>
      </ExhibitionProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
