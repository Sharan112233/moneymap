import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import VoiceCommand from './components/VoiceCommand'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Analytics from './pages/Analytics'
import Budget from './pages/Budget'
import Forecast from './pages/Forecast'
import Insights from './pages/Insights'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function AppLayout({ children, theme, toggleTheme }) {
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Sidebar handles desktop sidebar + mobile drawer + bottom nav internally */}
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      <main
        className="main-content"
        style={{ flex:1, overflowY:'auto', background:'var(--bg)', padding:'28px', minWidth:0 }}
      >
        {children}
      </main>
      <VoiceCommand />
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const wrap = (children) => (
    <ProtectedRoute>
      <AppLayout theme={theme} toggleTheme={toggleTheme}>{children}</AppLayout>
    </ProtectedRoute>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/"                element={wrap(<Navigate to="/dashboard" />)} />
        <Route path="/dashboard"       element={wrap(<Dashboard />)} />
        <Route path="/transactions"    element={wrap(<Transactions />)} />
        <Route path="/analytics"       element={wrap(<Analytics />)} />
        <Route path="/budget"          element={wrap(<Budget />)} />
        <Route path="/forecast"        element={wrap(<Forecast />)} />
        <Route path="/insights"        element={wrap(<Insights />)} />
        <Route path="/reports"         element={wrap(<Reports />)} />
        <Route path="/profile"         element={wrap(<Profile />)} />
      </Routes>
    </BrowserRouter>
  )
}