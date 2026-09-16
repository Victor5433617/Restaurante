import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { faviconUrl } from './utils/urls.js'

const favicon = document.getElementById('favicon-dinamico');
if (favicon) favicon.href = faviconUrl();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
