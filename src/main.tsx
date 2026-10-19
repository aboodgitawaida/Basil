import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/palette.css'
import './styles/base.css'
import './styles/scene.css'
import './styles/ui.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
