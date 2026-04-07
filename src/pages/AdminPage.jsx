import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { adminAPI, mediaURL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Avatar from '../components/Avatar'
import { LoadingScreen, PageHeader } from '../components/ui'
import { timeAgo, getApiError } from '../utils'
import { User, Users, FileText, MessageSquare, Heart, BarChart2, Pin, X } from 'lucide-react'

export default function AdminPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return }
    loadStats()
  }, [user])

  const loadStats = async () => {
    setLoading(true)
    try { const { data } = await adminAPI.stats(); setStats(data) }
    catch (err) { addToast(getApiError(err), 'error') }
    setLoading(false)
  }

  const loadUsers = async () => {
    setLoading(true)
    try { const { data } = await adminAPI.listUsers({ page: 1, size: 50, q: search }); setUsers(data.items) }
    catch { addToast('Ошибка', 'error') }
    setLoading(false)
  }

  const loadPosts = async () => {
    setLoading(true)
    try { const { data } = await adminAPI.listPosts({ page: 1, size: 50, q: search }); setPosts(data.items) }
    catch { addToast('Ошибка', 'error') }
    setLoading(false)
  }

  const handleTabChange = (t) => {
    setTab(t); setSearch('')
    if (t === 'users') setTimeout(loadUsers, 0)
    else if (t === 'posts') setTimeout(loadPosts, 0)
  }

  const handleToggleActive = async (u) => {
    try {
      const { data } = await adminAPI.updateUser(u.id, { is_active: !u.is_active })
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: data.is_active } : x))
      addToast(`Пользователь ${data.is_active ? 'активирован' : 'заблокирован'}`)
    } catch { addToast('Ошибка', 'error') }
  }

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Удалить @${u.username}? Это нельзя отменить.`)) return
    try { await adminAPI.deleteUser(u.id); setUsers(prev => prev.filter(x => x.id !== u.id)); addToast('Пользователь удалён') }
    catch { addToast('Ошибка', 'error') }
  }

  const handleDeletePost = async (p) => {
    if (!window.confirm('Удалить пост?')) return
    try { await adminAPI.deletePost(p.id); setPosts(prev => prev.filter(x => x.id !== p.id)); addToast('Пост удалён') }
    catch { addToast('Ошибка', 'error') }
  }

  const handlePinPost = async (p) => {
    try { await adminAPI.pinPost(p.id); setPosts(prev => prev.map(x => x.id === p.id ? { ...x, is_pinned: !x.is_pinned } : x)) }
    catch { addToast('Ошибка', 'error') }
  }

  const TABS = [{ key: 'stats', label: 'Статистика' }, { key: 'users', label: 'Пользователи' }, { key: 'posts', label: 'Посты' }]

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem 1.25rem 3rem' }}>
      <PageHeader title="Администрирование" subtitle="Управление платформой" />

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => handleTabChange(t.key)} style={{
            padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
            background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
            marginBottom: -1, cursor: 'pointer', color: tab === t.key ? 'var(--accent)' : 'var(--text3)', transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && (loading ? <LoadingScreen /> : stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Пользователей', value: stats.total_users, icon: <User size={22} color="var(--accent)" />, color: 'var(--accent)' },
              { label: 'Активных', value: stats.active_users, icon: <Users size={22} color="var(--green)" />, color: 'var(--green)' },
              { label: 'Постов', value: stats.total_posts, icon: <FileText size={22} color="#f97316" />, color: '#f97316' },
              { label: 'Комментариев', value: stats.total_comments, icon: <MessageSquare size={22} color="#4fc3f7" />, color: '#4fc3f7' },
              { label: 'Лайков', value: stats.total_likes, icon: <Heart size={22} color="var(--red)" />, color: 'var(--red)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'Montserrat, sans-serif' }}>{(s.value || 0).toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 4 }}>Новых сегодня</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'Montserrat, sans-serif' }}>+{stats.new_users_today || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>пользователей</div>
            </div>
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 4 }}>Новых постов</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'Montserrat, sans-serif' }}>+{stats.new_posts_today || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>за сегодня</div>
            </div>
          </div>
        </div>
      ))}

      {tab === 'users' && (
        <>
          <form onSubmit={e => { e.preventDefault(); loadUsers() }} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск пользователей..." className="input" style={{ flex: 1 }} />
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', flexShrink: 0 }}>Найти</button>
          </form>
          {loading ? <LoadingScreen /> : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>Пользователи не найдены</div>
              ) : users.map((u, i) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <Avatar user={u} size="sm" />
                  <Link to={`/users/${u.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {u.username}
                      {u.role === 'admin' && <span style={{ fontSize: 10, background: 'var(--accent-glow)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>admin</span>}
                      {!u.is_active && <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: 'var(--red)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>заблок.</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{u.full_name} · {u.email}</div>
                  </Link>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    {u.is_active ? (
                      <button onClick={() => handleToggleActive(u)} className="btn-ghost"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}>
                        Заблокировать
                      </button>
                    ) : (
                      <button onClick={() => handleToggleActive(u)} className="btn-ghost"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: 'var(--green)', borderColor: 'rgba(34,197,94,0.3)' }}>
                        Разблокировать
                      </button>
                    )}
                    {user.id !== u.id && (
                      <button onClick={() => handleDeleteUser(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '0.25rem 0.5rem', borderRadius: 6, display: 'flex' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}><X size={15} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'posts' && (
        <>
          <form onSubmit={e => { e.preventDefault(); loadPosts() }} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск постов..." className="input" style={{ flex: 1 }} />
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', flexShrink: 0 }}>Найти</button>
          </form>
          {loading ? <LoadingScreen /> : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>Посты не найдены</div>
              ) : posts.map((p, i) => {
                const img = p.image_url ? mediaURL(p.image_url) : null
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: i < posts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    {img && <img src={img} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
                    {!img && <div style={{ width: 44, height: 44, background: 'var(--bg3)', borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} color="var(--text3)" /></div>}
                    <Link to={`/posts/${p.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {p.is_pinned && <Pin size={13} color="var(--yellow)" />} {p.title || p.content.slice(0, 60)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>@{p.author.username} · <Heart size={11} /> {p.likes_count} · {timeAgo(p.created_at)}</div>
                    </Link>
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                      <button onClick={() => handlePinPost(p)} title={p.is_pinned ? 'Открепить' : 'Закрепить'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', opacity: p.is_pinned ? 1 : 0.4, transition: 'opacity 0.15s', display: 'flex', color: 'var(--yellow)' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = p.is_pinned ? 1 : 0.4}><Pin size={16} /></button>
                      <button onClick={() => handleDeletePost(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '0.25rem 0.5rem', borderRadius: 6, display: 'flex' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}><X size={15} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
