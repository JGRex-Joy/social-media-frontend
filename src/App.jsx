import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import { useAuth } from './context/AuthContext'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FeedPage from './pages/FeedPage'
import DashboardPage from './pages/DashboardPage'
import PostsPage from './pages/PostsPage'
import PostDetailPage from './pages/PostDetailPage'
import PostFormPage from './pages/PostFormPage'
import UsersPage from './pages/UsersPage'
import UserProfilePage from './pages/UserProfilePage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'
import MessagesPage from './pages/MessagesPage'

const NO_SIDEBAR_PATHS = ['/', '/login', '/register']

// Theme stored in localStorage, applied as class on <html>
function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, setDark]
}

function AppShell({ dark, setDark }) {
  const location = useLocation()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const showSidebar = user && !NO_SIDEBAR_PATHS.includes(location.pathname)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {showSidebar && (
        <>
          <Sidebar
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
            dark={dark}
            onToggleTheme={() => setDark(d => !d)}
          />
          {mobileOpen && (
            <div
              onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 49 }}
            />
          )}
        </>
      )}

      <div className={showSidebar ? 'main-content' : ''} style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

          <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/posts" element={<ProtectedRoute><PostsPage /></ProtectedRoute>} />
          <Route path="/posts/create" element={<ProtectedRoute><PostFormPage /></ProtectedRoute>} />
          <Route path="/posts/:id" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
          <Route path="/posts/:id/edit" element={<ProtectedRoute><PostFormPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
          <Route path="/users/:id" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/messages/:userId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />

          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {showSidebar && (
          <MobileBottomNav
            onMenuOpen={() => setMobileOpen(true)}
            dark={dark}
            onToggleTheme={() => setDark(d => !d)}
          />
        )}
      </div>
    </div>
  )
}

function MobileBottomNav({ onMenuOpen, dark, onToggleTheme }) {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  const items = [
    {
      to: '/feed', active: path === '/feed',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill={path==='/feed'?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9" strokeLinejoin="round"/></svg>
    },
    {
      to: '/posts', active: path.startsWith('/posts'),
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    },
    {
      to: '/messages', active: path.startsWith('/messages'),
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill={path.startsWith('/messages')?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    },
    {
      to: '/notifications', active: path==='/notifications',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
    },
    {
      to: '/profile', active: path==='/profile',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    },
  ]

  return (
    <nav className="bottom-nav" style={{ display: 'none' }}>
      {items.map(item => (
        <button key={item.to} onClick={() => navigate(item.to)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: item.active ? 'var(--accent)' : 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', flex: 1 }}>
          {item.icon}
        </button>
      ))}
      <button onClick={onToggleTheme}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', flex: 1 }}>
        {dark
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        }
      </button>
    </nav>
  )
}

export default function App() {
  const [dark, setDark] = useTheme()

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppShell dark={dark} setDark={setDark} />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
