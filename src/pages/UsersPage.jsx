import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Avatar from '../components/Avatar'
import { LoadingScreen, EmptyState, Pagination, PageHeader } from '../components/ui'

export default function UsersPage() {
  const { user: me } = useAuth()
  const { addToast } = useToast()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debounceRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q') || ''
    setSearch(q)
  }, [])

  const fetchUsers = useCallback(async (p = 1, q = search) => {
    setLoading(true)
    try {
      const { data } = await usersAPI.list({ page: p, size: 20, q })
      setUsers(data.items); setTotal(data.total); setPages(data.pages); setPage(p)
    } catch {}
    setLoading(false)
  }, [search])

  useEffect(() => { fetchUsers(1, search) }, [search])

  const handleSearchChange = (val) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(val), 300)
  }

  const handleFollow = async (userId, isFollowing) => {
    try {
      if (isFollowing) await usersAPI.unfollow(userId)
      else await usersAPI.follow(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_following: !isFollowing } : u))
    } catch { addToast('Ошибка', 'error') }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1.25rem 3rem' }}>
      <PageHeader title={<>Люди {total > 0 && <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '1rem' }}>· {total}</span>}</>} />

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            defaultValue={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Поиск людей..." className="input" style={{ paddingLeft: 36 }} />
        </div>
      </div>

      {loading ? <LoadingScreen /> : users.length === 0 ? (
        <EmptyState icon="👤" title="Никого не найдено"
          description={search ? `По запросу «${search}» никого нет` : 'Здесь пока никого нет'} />
      ) : (
        <>
          <div className="card" style={{ overflow: 'hidden' }}>
            {users.map((u, i) => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 1rem',
                borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Link to={`/users/${u.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: 1, textDecoration: 'none' }}>
                  <Avatar user={u} size="md" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
                      {u.is_verified && <span style={{ color: 'var(--accent)', fontSize: 11, flexShrink: 0 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.full_name || `${u.followers_count} подписчиков`}
                    </div>
                  </div>
                </Link>
                {me && me.id !== u.id && (
                  <button onClick={() => handleFollow(u.id, u.is_following)}
                    className={u.is_following ? 'btn-ghost' : 'btn-primary'}
                    style={{ marginLeft: '0.75rem', padding: '0.375rem 1rem', fontSize: '0.8rem', flexShrink: 0 }}>
                    {u.is_following ? 'Подписан' : 'Подписаться'}
                  </button>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} pages={pages} onPage={(p) => { fetchUsers(p); window.scrollTo(0, 0) }} />
        </>
      )}
    </div>
  )
}
