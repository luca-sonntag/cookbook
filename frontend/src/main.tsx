import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DialogProvider } from './context/DialogContext.tsx'
import { I18nProvider } from './context/I18nContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <DialogProvider>
        <App />
      </DialogProvider>
    </I18nProvider>
  </StrictMode>,
)

