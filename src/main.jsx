import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './i18n/LanguageContext'
import { RecurringProvider } from './context/RecurringContext'
import { DcfProvider } from './context/DcfContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <RecurringProvider>
        <DcfProvider>
          <App />
        </DcfProvider>
      </RecurringProvider>
    </LanguageProvider>
  </StrictMode>,
)
