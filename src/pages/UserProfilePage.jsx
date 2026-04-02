import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usersAPI, postsAPI, mediaURL, messagesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Avatar from '../components/Avatar'
import { LoadingScreen, EmptyState, Pagination, Spinner } from '../components/ui'
import { formatDate } from '../utils'
import { CheckCircle, Camera, UserX, Heart, MessageSquare } from 'lucide-react'

export default function UserProfilePage() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [postsPage, setPostsPage] = useState(1)
  const [postsPages, setPostsPages] = useState(1)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('posts')
  const [followers, setFollowers] = useState([])
  const [followingList, setFollowingList] = useState([])
  const [socialLoading, setSocialLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    usersAPI.getById(id)
      .then(r => { setProfile(r.data); setFollowing(r.data.is_following) })
      .catch(() => navigate('/users'))
      .finally(() => setLoading(false))
    loadPosts(1)
  }, [id])

  const loadPosts = async (p) => {
    try {
      const { data } = await postsAPI.list({ author_id: id, page: p, size: 12 })
      setPosts(data.items); setPostsPages(data.pages); setPostsPage(p)
    } catch {}
  }

  const loadSocial = async (type) => {
    setSocialLoading(true)
    try {
      if (type === 'followers') { const { data } = await usersAPI.getFollowers(id, { page: 1, size: 50 }); setFollowers(data.items) }
      else { const { data } = await usersAPI.getFollowing(id, { page: 1, size: 50 }); setFollowingList(data.items) }
    } catch {}
    setSocialLoading(false)
  }

  const handleTabChange = (t) => {
    setTab(t)
    if (t === 'followers' && !followers.length) loadSocial('followers')
    if (t === 'following' && !followingList.length) loadSocial('following')
  }

  const handleFollow = async () => {
    if (!me) { navigate('/login'); return }
    setFollowLoading(true)
    try {
      if (following) { await usersAPI.unfollow(id); setFollowing(false); setProfile(p => ({ ...p, followers_count: p.followers_count - 1 })) }
      else { await usersAPI.follow(id); setFollowing(true); setProfile(p => ({ ...p, followers_count: p.followers_count + 1 })) }
    } catch { addToast('Ошибка', 'error') }
    setFollowLoading(false)
  }

  if (loading) return <LoadingScreen />
  if (!profile) return null
  const isMe = me?.id === profile.id
  const socialList = tab === 'followers' ? followers : followingList

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem 1.25rem 3rem' }}>
      {/* Profile header */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '3rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Avatar user={profile} size="2xl" />

        <div style={{ flex: 1, minWidth: 200 }}>
          {/* Name + actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 400, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {profile.username}
              {profile.is_verified && <span style={{ color: 'var(--accent)', fontSize: 14, display: 'inline-flex' }}><CheckCircle size={16} /></span>}
            </h1>
            {isMe ? (
              <Link to="/profile" className="btn-ghost" style={{ padding: '0.375rem 1rem', fontSize: '0.875rem' }}>Редактировать</Link>
            ) : me && (
              <>
                <button onClick={handleFollow} disabled={followLoading}
                  className={following ? 'btn-ghost' : 'btn-primary'}
                  style={{ padding: '0.375rem 1.25rem', fontSize: '0.875rem' }}>
                  {followLoading ? <Spinner size={14} color={following ? 'var(--text2)' : '#fff'} /> : following ? 'Подписан' : 'Подписаться'}
                </button>
                <button onClick={() => navigate(`/messages/${profile.id}`)} className="btn-ghost" style={{ padding: '0.375rem 0.875rem', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  Написать
                </button>
              </>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <StatItem label="публикаций" value={profile.posts_count} />
            <StatItem label="подписчиков" value={profile.followers_count} onClick={() => handleTabChange('followers')} />
            <StatItem label="подписок" value={profile.following_count} onClick={() => handleTabChange('following')} />
          </div>

          {/* Bio */}
          <div>
            {profile.full_name && <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{profile.full_name}</div>}
            {profile.bio && <div style={{ fontSize: '0.875rem', color: 'var(--text2)', whiteSpace: 'pre-wrap', marginTop: 4 }}>{profile.bio}</div>}
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 6 }}>На Pulse с {formatDate(profile.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderTop: '1px solid var(--border)', display: 'flex', marginBottom: '1.5rem' }}>
        {[
          { key: 'posts', label: 'Публикации' },
          { key: 'followers', label: 'Подписчики' },
          { key: 'following', label: 'Подписки' },
        ].map(t => (
          <button key={t.key} onClick={() => handleTabChange(t.key)} style={{
            flex: 1, padding: '0.875rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            background: 'none', border: 'none', borderTop: `2px solid ${tab === t.key ? 'var(--text)' : 'transparent'}`,
            marginTop: -1, cursor: 'pointer', color: tab === t.key ? 'var(--text)' : 'var(--text3)', transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {tab === 'posts' && (
        posts.length === 0 ? (
          <EmptyState icon={<Camera size={48} />} title="Публикаций нет"
            description={isMe ? 'Поделитесь первой фотографией или постом' : undefined} />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {posts.map(post => {
                const img = post.image_url ? mediaURL(post.image_url) : null
                return (
                  <Link key={post.id} to={`/posts/${post.id}`} style={{ position: 'relative', aspectRatio: '1', display: 'block', overflow: 'hidden' }}>
                    {img ? (
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text2)', textAlign: 'center', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>{post.title || post.content}</p>
                      </div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                      <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={14} fill="white" /> {post.likes_count}</span>
                      <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={14} /> {post.comments_count}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
            <Pagination page={postsPage} pages={postsPages} onPage={loadPosts} />
          </>
        )
      )}

      {/* Followers / Following */}
      {(tab === 'followers' || tab === 'following') && (
        socialLoading ? <LoadingScreen /> : socialList.length === 0 ? (
          <EmptyState icon={<UserX size={48} />} title={tab === 'followers' ? 'Нет подписчиков' : 'Нет подписок'} />
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {socialList.map((u, i) => (
              <Link key={u.id} to={`/users/${u.id}`} style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem',
                borderBottom: i < socialList.length - 1 ? '1px solid var(--border)' : 'none',
                textDecoration: 'none', transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Avatar user={u} size="md" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {u.username} {u.is_verified && <span style={{ color: 'var(--accent)', fontSize: 11, display: 'inline-flex' }}><CheckCircle size={12} /></span>}
                  </div>
                  {u.full_name && <div style={{ fontSize: '0.8rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</div>}
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function StatItem({ label, value, onClick }) {
  const el = (
    <div style={{ textAlign: 'center' }}>
      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{value}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--text3)', marginLeft: 4 }}>{label}</span>
    </div>
  )
  if (onClick) return <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{el}</button>
  return el
}
