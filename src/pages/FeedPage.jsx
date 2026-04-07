import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { postsAPI, usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'
import Avatar from '../components/Avatar'
import StoriesBar from '../components/StoriesBar'
import { LoadingScreen, EmptyState } from '../components/ui'
import { Camera, Check } from 'lucide-react'

const FEED_CACHE_KEY = 'feedPage_cache'

export default function FeedPage() {
  const { user } = useAuth()
  const getCached = () => { try { return JSON.parse(sessionStorage.getItem(FEED_CACHE_KEY)) } catch { return null } }
  const cached = getCached()

  const [posts, setPosts] = useState(cached?.posts || [])
  const [page, setPage] = useState(cached?.page || 1)
  const [hasMore, setHasMore] = useState(cached?.hasMore ?? true)
  const [loading, setLoading] = useState(!cached)
  const [loadingMore, setLoadingMore] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    loadFeed(1, true)
    loadSuggestions()
  }, [])

  const loadFeed = async (p, reset = false) => {
    if (p === 1 && !posts.length) setLoading(true)
    else if (p > 1) setLoadingMore(true)
    try {
      const { data } = await postsAPI.feed({ page: p, size: 10 })
      const newPosts = reset ? data.items : [...posts, ...data.items]
      setPosts(newPosts)
      setHasMore(p < data.pages)
      setPage(p)
      try { sessionStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ posts: newPosts, page: p, hasMore: p < data.pages })) } catch {}
    } catch {}
    setLoading(false)
    setLoadingMore(false)
  }

  const loadSuggestions = async () => {
    try {
      const { data } = await usersAPI.list({ page: 1, size: 6 })
      setSuggestions(data.items.filter(u => u.id !== user?.id && !u.is_following).slice(0, 5))
    } catch {}
  }

  const handleDelete = (id) => setPosts(prev => prev.filter(p => p.id !== id))
  const handleLike = (id, data) => setPosts(prev => prev.map(p =>
    p.id === id ? { ...p, is_liked: data.liked, likes_count: data.likes_count } : p
  ))

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start' }}>

        <div style={{ width: '100%', maxWidth: 480 }}>
          <div className="card" style={{ padding: '1rem', marginBottom: '1rem', overflowX: 'auto' }}>
            <StoriesBar currentUser={user} />
          </div>

          {loading ? <LoadingScreen /> : posts.length === 0 ? (
            <EmptyState
              icon={<Camera size={48} />}
              title="Лента пуста"
              description="Подпишитесь на людей, чтобы видеть их публикации"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {posts.map(post => (
                <PostCard key={post.id} post={post} onDelete={handleDelete} onLikeToggle={handleLike} />
              ))}
              {hasMore && (
                <button onClick={() => loadFeed(page + 1)} disabled={loadingMore}
                  className="btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                  {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
                </button>
              )}
              {!hasMore && posts.length > 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.875rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>Вы всё посмотрели <Check size={14} /></div>
              )}
            </div>
          )}
        </div>

        <div style={{ width: 280, flexShrink: 0, display: 'none' }} className="lg-sidebar">
          <div style={{ position: 'sticky', top: '1.5rem' }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <Link to={`/users/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                  <Avatar user={user} size="md" />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{user.username}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{user.full_name}</div>
                  </div>
                </Link>
                <Link to="/profile" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>Изменить</Link>
              </div>
            )}

            {suggestions.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Рекомендации</span>
                  <Link to="/users" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text2)', textDecoration: 'none' }}>Все →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {suggestions.map(u => (
                    <SuggestionRow key={u.id} user={u} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function SuggestionRow({ user: u }) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFollow = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await usersAPI.follow(u.id)
      setFollowing(true)
    } catch {}
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to={`/users/${u.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', minWidth: 0 }}>
        <Avatar user={u} size="sm" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {u.full_name || `${u.followers_count} подп.`}
          </div>
        </div>
      </Link>
      <button onClick={handleFollow} disabled={following || loading}
        style={{ fontSize: '0.8rem', fontWeight: 700, color: following ? 'var(--text3)' : 'var(--accent)', background: 'none', border: 'none', cursor: following ? 'default' : 'pointer', flexShrink: 0, marginLeft: '0.5rem' }}>
        {following ? 'Подписан' : 'Подписаться'}
      </button>
    </div>
  )
}
