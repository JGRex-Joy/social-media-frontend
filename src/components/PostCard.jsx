import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import { postsAPI, mediaURL } from '../services/api'
import { timeAgo } from '../utils'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { CheckCircle, Pin } from 'lucide-react'

const HeartIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : 'currentColor'} strokeWidth="1.8">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
)
const CommentIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)

export default function PostCard({ post, onDelete, onLikeToggle }) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(post.is_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showMenu, setShowMenu] = useState(false)
  const [likeAnim, setLikeAnim] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef(null)
  const isOwner = user?.id === post.author_id

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLike = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setLikeAnim(true)
    setTimeout(() => setLikeAnim(false), 300)
    const nextLiked = !liked
    setLiked(nextLiked)
    setLikesCount(c => nextLiked ? c + 1 : c - 1)
    try {
      const { data } = await postsAPI.toggleLike(post.id)
      setLiked(data.liked)
      setLikesCount(data.likes_count)
      if (onLikeToggle) onLikeToggle(post.id, data)
    } catch { setLiked(!nextLiked); setLikesCount(c => nextLiked ? c - 1 : c + 1) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Удалить публикацию?')) return
    setDeleting(true)
    try {
      await postsAPI.delete(post.id)
      addToast('Публикация удалена')
      if (onDelete) onDelete(post.id)
    } catch {
      addToast('Не удалось удалить', 'error')
    }
    setDeleting(false)
  }

  const imgUrl = post.image_url ? mediaURL(post.image_url) : null

  return (
    <article className="card fade-up" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem' }}>
        <Link to={`/users/${post.author_id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <Avatar user={post.author} size="sm" />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {post.author.username}
              {post.author.is_verified && <span style={{ color: 'var(--accent)', fontSize: 11, display: 'inline-flex' }}><CheckCircle size={12} /></span>}
              {post.is_pinned && <span style={{ color: 'var(--yellow)', fontSize: 11, display: 'inline-flex' }}><Pin size={12} /></span>}
            </div>
            {post.author.full_name && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{post.author.full_name}</div>
            )}
          </div>
        </Link>

        {isOwner && (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button onClick={() => setShowMenu(p => !p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, display: 'flex', borderRadius: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            {showMenu && (
              <div className="card fade-in" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 160, zIndex: 20, padding: '0.25rem', overflow: 'hidden' }}>
                <MenuBtn onClick={() => { navigate(`/posts/${post.id}/edit`); setShowMenu(false) }}>Редактировать</MenuBtn>
                <MenuBtn onClick={() => { handleDelete(); setShowMenu(false) }} red>{deleting ? 'Удаление...' : 'Удалить'}</MenuBtn>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      {imgUrl && (
        <Link to={`/posts/${post.id}`} style={{ display: 'block' }}>
          <img src={imgUrl} alt={post.title || ''} style={{ width: '100%', maxHeight: 520, objectFit: 'contain', display: 'block', background: 'var(--bg3)' }} />
        </Link>
      )}

      {/* Text-only post */}
      {!imgUrl && (
        <Link to={`/posts/${post.id}`} style={{ display: 'block', padding: '0 1rem 0.75rem', textDecoration: 'none' }}>
          {post.title && <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.375rem' }}>{post.title}</h3>}
          <p style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.content}</p>
        </Link>
      )}

      {/* Actions */}
      <div style={{ padding: '0.625rem 1rem 0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <button onClick={handleLike}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', color: liked ? '#ef4444' : 'var(--text2)', transform: likeAnim ? 'scale(1.3)' : 'scale(1)', transition: 'transform 0.2s' }}>
            <HeartIcon filled={liked} />
            {likesCount > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{likesCount}</span>}
          </button>
          <Link to={`/posts/${post.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text2)', textDecoration: 'none' }}>
            <CommentIcon />
            {post.comments_count > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{post.comments_count}</span>}
          </Link>
        </div>

        {/* Caption for image posts */}
        {imgUrl && (
          <div style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.5 }}>
            <Link to={`/users/${post.author_id}`} style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none', marginRight: '0.375rem' }}>{post.author.username}</Link>
            {post.title && <span style={{ fontWeight: 500, marginRight: '0.25rem' }}>{post.title} </span>}
            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.content}</span>
          </div>
        )}

        {post.comments_count > 0 && (
          <Link to={`/posts/${post.id}`} style={{ fontSize: '0.8rem', color: 'var(--text3)', display: 'block', marginTop: '0.25rem', textDecoration: 'none' }}>
            Смотреть все комментарии ({post.comments_count})
          </Link>
        )}

        <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{timeAgo(post.created_at)}</div>
      </div>
    </article>
  )
}

function MenuBtn({ children, onClick, red }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
      background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem',
      color: red ? 'var(--red)' : 'var(--text2)', borderRadius: 6, transition: 'all 0.1s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >{children}</button>
  )
}
