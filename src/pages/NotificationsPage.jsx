import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { notificationsAPI } from '../services/api'
import { useToast } from '../context/ToastContext'
import Avatar from '../components/Avatar'
import { LoadingScreen, EmptyState, PageHeader } from '../components/ui'
import { timeAgo } from '../utils'
import { Heart, MessageSquare, UserPlus, CornerUpLeft, AtSign, Pin, Bell } from 'lucide-react'

const TYPE_ICON = {
  like: <Heart size={13} fill="currentColor" />,
  comment: <MessageSquare size={13} />,
  follow: <UserPlus size={13} />,
  reply: <CornerUpLeft size={13} />,
  mention: <AtSign size={13} />,
  post: <Pin size={13} />
}
const TYPE_COLOR = { like: '#ef4444', comment: 'var(--accent)', follow: 'var(--green)', reply: '#f97316', mention: '#a855f7', post: 'var(--yellow)' }

function getLink(n) {
  if (n.entity_type === 'post' || n.entity_type === 'comment') return `/posts/${n.entity_id}`
  if (n.entity_type === 'user') return `/users/${n.entity_id}`
  return '#'
}

export default function NotificationsPage() {
  const { addToast } = useToast()
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markAllLoading, setMarkAllLoading] = useState(false)

  useEffect(() => {
    notificationsAPI.list({ page: 1, size: 50 })
      .then(r => { setNotifs(r.data.items); setUnread(r.data.unread_count) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnread(p => Math.max(0, p - 1))
    } catch {}
  }

  const markAllRead = async () => {
    setMarkAllLoading(true)
    try {
      await notificationsAPI.markAllRead()
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnread(0)
      addToast('Все уведомления прочитаны')
    } catch {}
    setMarkAllLoading(false)
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1.25rem 3rem' }}>
      <PageHeader
        title={<span>Уведомления {unread > 0 && <span className="badge badge-red" style={{ marginLeft: 8, fontSize: 11 }}>{unread}</span>}</span>}
        action={unread > 0 && (
          <button onClick={markAllRead} disabled={markAllLoading} className="btn-ghost" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
            {markAllLoading ? '...' : 'Прочитать все'}
          </button>
        )}
      />

      {loading ? <LoadingScreen /> : notifs.length === 0 ? (
        <EmptyState icon={<Bell size={48} />} title="Уведомлений нет" description="Здесь появятся лайки, комментарии и подписки" />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {notifs.map((n, i) => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.875rem 1rem',
                borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none',
                background: !n.is_read ? 'rgba(124,106,247,0.06)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = !n.is_read ? 'rgba(124,106,247,0.06)' : 'transparent'}
            >
              {/* Avatar with type badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {n.actor ? (
                  <Link to={`/users/${n.actor.id}`} onClick={e => e.stopPropagation()}>
                    <Avatar user={n.actor} size="md" />
                  </Link>
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {TYPE_ICON[n.type] || <Bell size={18} />}
                  </div>
                )}
                <span style={{ position: 'absolute', bottom: -2, right: -2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TYPE_COLOR[n.type] || 'var(--text3)', lineHeight: 1 }}>
                  {TYPE_ICON[n.type]}
                </span>
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.5 }}>
                  {n.actor && (
                    <Link to={`/users/${n.actor.id}`} onClick={e => e.stopPropagation()}
                      style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none', marginRight: 4 }}>
                      {n.actor.username}
                    </Link>
                  )}
                  <Link to={getLink(n)} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {n.message}
                  </Link>
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>{timeAgo(n.created_at)}</div>
              </div>

              {!n.is_read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
