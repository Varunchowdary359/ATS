import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './ThemeContext.jsx'
import { FilterProvider } from './FilterContext.jsx'
import { DashboardPreferencesProvider } from './DashboardPreferencesContext.jsx'
import DashboardErrorBoundary from './components/dashboard/shared/DashboardErrorBoundary.jsx'

const rootElement = document.getElementById('root')

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <DashboardPreferencesProvider>
        <FilterProvider>
          <App />
        </FilterProvider>
      </DashboardPreferencesProvider>
    </ThemeProvider>
  </StrictMode>
)
