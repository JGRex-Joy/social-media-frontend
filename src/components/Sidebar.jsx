import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationsAPI, messagesAPI } from '../services/api'
import Avatar from './Avatar'

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)

const icons = {
  feed: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9" strokeLinejoin="round"/></svg>,
  posts: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85"/></svg>,
  messages: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  notifications: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  profile: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="11" rx="1"/><rect x="14" y="14" width="7" height="11" rx="1"/></svg>,
  admin: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
}

export default function Sidebar({ mobileOpen, onClose, dark, onToggleTheme }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
  const [unreadNotif, setUnreadNotif] = useState(0)
  const [unreadMsg, setUnreadMsg] = useState(0)

  useEffect(() => {
    if (!user) return
    notificationsAPI.list({ page: 1, size: 1 })
      .then(r => setUnreadNotif(r.data.unread_count || 0))
      .catch(() => {})
    messagesAPI.inbox()
      .then(r => {
        const total = (r.data || []).reduce((s, c) => s + (c.unread_count || 0), 0)
        setUnreadMsg(total)
      })
      .catch(() => {})
  }, [user, path])

  const handleLogout = async () => {
    await logout()
    navigate('/')
    onClose?.()
  }

  const navTo = (to) => {
    navigate(to)
    onClose?.()
  }

  const isActive = (to) => {
    if (to === '/feed') return path === '/feed'
    return path.startsWith(to)
  }

  if (!user) return null

  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.25rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navTo('/feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span className="logo-font" style={{ fontSize: '1.5rem', color: 'var(--text)' }}>pulse</span>
        </button>
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={dark ? 'Светлая тема' : 'Тёмная тема'}
          style={{
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0.375rem',
            cursor: 'pointer',
            color: 'var(--text3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-glow)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'var(--bg3)' }}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      {/* User mini card */}
      <div
        style={{ margin: '0 0.75rem 0.75rem', padding: '0.75rem', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
        onClick={() => navTo(`/users/${user.id}`)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Avatar user={user} size="md" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.full_name || user.username}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>@{user.username}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <NavItem icon={icons.feed} label="Лента" active={isActive('/feed')} onClick={() => navTo('/feed')} />
        <NavItem icon={icons.posts} label="Публикации" active={isActive('/posts')} onClick={() => navTo('/posts')} />
        <NavItem icon={icons.users} label="Люди" active={isActive('/users')} onClick={() => navTo('/users')} />
        <NavItem icon={icons.messages} label="Сообщения" active={isActive('/messages')} onClick={() => navTo('/messages')} badge={unreadMsg} />
        <NavItem icon={icons.notifications} label="Уведомления" active={isActive('/notifications')} onClick={() => navTo('/notifications')} badge={unreadNotif} />

        <div className="divider" style={{ margin: '0.75rem 0' }} />

        <NavItem icon={icons.profile} label="Профиль" active={path === '/profile'} onClick={() => navTo('/profile')} />
        <NavItem icon={icons.dashboard} label="Статистика" active={isActive('/dashboard')} onClick={() => navTo('/dashboard')} />
        {user.role === 'admin' && (
          <NavItem icon={icons.admin} label="Админка" active={isActive('/admin')} onClick={() => navTo('/admin')} />
        )}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navTo('/posts/create')}>
          {icons.plus} Новая публикация
        </button>
        <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--red)' }}>
          {icons.logout} Выйти
        </button>
      </div>
    </aside>
  )
}

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button className={`nav-link ${active ? 'active' : ''}`} onClick={onClick}>
      <span style={{ position: 'relative', display: 'flex' }}>
        {icon}
        {badge > 0 && (
          <span className="badge badge-red" style={{ position: 'absolute', top: -6, right: -6, fontSize: 9 }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </button>
  )
}
