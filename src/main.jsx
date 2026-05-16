import { createRoot } from 'react-dom/client'
import React from 'react'
import App from './App.jsx'
import './styles/main.css'
import { disconnectFirehose } from './firehose.js'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

window.addEventListener('beforeunload', () => {
  disconnectFirehose()
})
