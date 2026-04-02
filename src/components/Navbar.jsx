import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import { notificationsAPI } from '../services/api'
import { User, Settings, BarChart2, Shield, LogOut } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [search, setSearch] = useState('')
  const menuRef = useRef(null)
  const path = location.pathname

  useEffect(() => {
    if (!user) return
    notificationsAPI.list({ page: 1, size: 1 })
      .then(r => setUnread(r.data.unread_count || 0))
      .catch(() => {})
  }, [user, path])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/users?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setShowMenu(false)
  }

  if (!user) return null

  const navLinks = [
    { to: '/feed', label: 'Лента', icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9" strokeLinejoin="round"/>
      </svg>
    )},
    { to: '/posts', label: 'Публикации', icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    )},
    { to: '/users', label: 'Люди', icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="7" r="4"/>
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
        <path d="M21 21v-2a4 4 0 00-3-3.85"/>
      </svg>
    )},
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link to="/feed" className="flex-shrink-0 mr-2">
          <span className="logo-font text-2xl text-gray-900">Pulse</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden sm:block flex-1 max-w-xs">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск людей..."
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:bg-gray-50 border border-transparent focus:border-gray-200"
            />
          </div>
        </form>

        {/* Nav links */}
        <div className="flex items-center gap-1 ml-auto">
          {navLinks.map(({ to, label, icon }) => {
            const active = to === '/feed' ? path === '/feed' : path.startsWith(to)
            return (
              <Link key={to} to={to} title={label}
                className={`p-2.5 rounded-xl transition-colors ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                {icon(active)}
              </Link>
            )
          })}

          {/* Create post */}
          <Link to="/posts/create" title="Создать публикацию"
            className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="4"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
          </Link>

          {/* Notifications */}
          <Link to="/notifications" title="Уведомления"
            className={`relative p-2.5 rounded-xl transition-colors ${path === '/notifications' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={path === '/notifications' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          {/* Avatar / profile menu */}
          <div className="relative ml-1" ref={menuRef}>
            <button onClick={() => setShowMenu(p => !p)}
              className="rounded-full ring-2 ring-transparent hover:ring-gray-200 transition-all">
              <Avatar user={user} size="sm" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden fade-in z-50">
                {/* User header */}
                <Link to="/profile" onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 border-b border-gray-50">
                  <Avatar user={user} size="md" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{user.full_name || user.username}</div>
                    <div className="text-xs text-gray-400 truncate">@{user.username}</div>
                  </div>
                </Link>

                <div className="py-1.5">
                  <MenuItem to={`/users/${user.id}`} icon={<User size={15} />} label="Мой профиль" onClick={() => setShowMenu(false)} />
                  <MenuItem to="/profile" icon={<Settings size={15} />} label="Настройки" onClick={() => setShowMenu(false)} />
                  <MenuItem to="/dashboard" icon={<BarChart2 size={15} />} label="Статистика" onClick={() => setShowMenu(false)} />
                  {user.role === 'admin' && (
                    <MenuItem to="/admin" icon={<Shield size={15} />} label="Администрирование" onClick={() => setShowMenu(false)} />
                  )}
                </div>

                <div className="border-t border-gray-50 py-1.5">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut size={15} /> Выйти
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function MenuItem({ to, icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
