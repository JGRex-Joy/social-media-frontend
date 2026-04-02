import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { postsAPI, mediaURL } from '../services/api'
import Avatar from '../components/Avatar'
import { LoadingScreen, PageHeader } from '../components/ui'
import { timeAgo } from '../utils'
import { FileText, Users, UserPlus, Heart, MessageSquare } from 'lucide-react'

function StatCard({ label, value, icon }) {
  return (
    <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
      <div style={{ marginBottom: '0.375rem', display: 'flex', justifyContent: 'center', color: 'var(--text3)' }}>{icon}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'Montserrat, sans-serif' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    postsAPI.list({ author_id: user.id, page: 1, size: 6 })
      .then(r => setPosts(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null
  const totalLikes = posts.reduce((s, p) => s + p.likes_count, 0)
  const totalComments = posts.reduce((s, p) => s + p.comments_count, 0)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1.25rem 3rem' }}>
      <PageHeader title="Статистика" />

      {/* Profile summary */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Avatar user={user} size="xl" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{user.full_name || user.username}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text3)' }}>@{user.username}</div>
          {user.bio && <div style={{ fontSize: '0.875rem', color: 'var(--text2)', marginTop: 4 }}>{user.bio}</div>}
        </div>
        <Link to="/profile" className="btn-ghost" style={{ padding: '0.5rem 1rem', flexShrink: 0 }}>Редактировать</Link>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <StatCard label="Публикаций" value={user.posts_count} icon={<FileText size={28} />} />
        <StatCard label="Подписчиков" value={user.followers_count} icon={<Users size={28} />} />
        <StatCard label="Подписок" value={user.following_count} icon={<UserPlus size={28} />} />
        <StatCard label="Лайки" value={totalLikes} icon={<Heart size={28} />} />
        <StatCard label="Комментарии" value={totalComments} icon={<MessageSquare size={28} />} />
      </div>

      {/* Recent posts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Последние публикации</h2>
        <Link to="/posts/create" className="btn-primary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>+ Новая</Link>
      </div>

      {loading ? <LoadingScreen /> : posts.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}><FileText size={40} /></div>
          <p>Нет публикаций</p>
          <Link to="/posts/create" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', marginTop: '0.75rem', display: 'inline-block' }}>Создать первую →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {posts.map(post => {
            const img = post.image_url ? mediaURL(post.image_url) : null
            return (
              <Link key={post.id} to={`/posts/${post.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}>
                  {img && <img src={img} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                  {!img && <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} color="var(--text3)" /></div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.title || post.content.slice(0, 60)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>{timeAgo(post.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.875rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={12} /> {post.likes_count}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}><MessageSquare size={12} /> {post.comments_count}</span>
                  </div>
                </div>
              </Link>
            )
          })}
          <Link to={`/users/${user.id}`} style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Все публикации →
          </Link>
        </div>
      )}
    </div>
  )
}
