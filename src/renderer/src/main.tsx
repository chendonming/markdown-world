import './assets/main.css'
import './assets/preview-base.css'
import './assets/preview-theme-light.css'
import './assets/preview-theme-dark.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
