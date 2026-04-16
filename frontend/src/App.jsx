import { useCallback, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useTheme } from './lib/ThemeContext'
import Sidebar from './components/Sidebar'
import Chat from './pages/Chat'
import Operations from './pages/Operations'
import Sellers from './pages/Sellers'
import InsightsPage from './pages/InsightsPage'
import Settings from './pages/Settings'

const QUERY_LOG_KEY = 'supportops_query_log'

function loadQueryLog() {
  try {
    const raw = sessionStorage.getItem(QUERY_LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function App() {
  const { isDark } = useTheme()
  const [queryLog, setQueryLog] = useState(loadQueryLog)

  // Persist queryLog to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(QUERY_LOG_KEY, JSON.stringify(queryLog))
  }, [queryLog])

  const handleLogQuery = useCallback((entry) => {
    setQueryLog((prev) => [...prev, entry])
  }, [])

  const handleClearQueryLog = useCallback(() => {
    setQueryLog([])
    sessionStorage.removeItem(QUERY_LOG_KEY)
  }, [])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-surface-950 bg-grid-dark' : 'bg-surface-50 bg-grid-light'}`}>
      <Sidebar />
      <main className="min-h-screen px-4 pb-10 pt-6 sm:px-8 lg:ml-[280px] lg:px-10">
        <Routes>
          <Route path="/" element={<Chat onLogQuery={handleLogQuery} onClearQueryLog={handleClearQueryLog} />} />
          <Route path="/dashboard" element={<Operations />} />
          <Route path="/sellers" element={<Sellers />} />
          <Route path="/insights" element={<InsightsPage queryLog={queryLog} />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
