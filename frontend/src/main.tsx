import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DialogProvider } from './context/DialogContext.tsx'
import { I18nProvider } from './context/I18nContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { TimerProvider } from './context/TimerContext.tsx'
import { initNativeUi } from './native'

// Theme the native status bar and dismiss the splash screen (no-op on web).
initNativeUi()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <I18nProvider>
        <DialogProvider>
          <TimerProvider>
            <App />
          </TimerProvider>
        </DialogProvider>
      </I18nProvider>
    </AuthProvider>
  </StrictMode>,
)

