import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import { ThemeProvider } from './ThemeContext.jsx'
import { FilterProvider } from './FilterContext.jsx'
import { DashboardPreferencesProvider } from './DashboardPreferencesContext.jsx'

export function render() {
  const html = renderToString(
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
  return { html }
}
