
window.addEventListener("error", (e) => {
  document.body.innerHTML += '<div style="color:red; background:white; padding: 20px; z-index:9999; position:fixed; top:0; left:0; right:0;">Error: ' + e.message + ' <br> ' + e.error?.stack + '</div>';
});
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
