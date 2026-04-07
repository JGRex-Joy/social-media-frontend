import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { postsAPI, commentsAPI, mediaURL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Avatar from '../components/Avatar'
import { LoadingScreen, Spinner } from '../components/ui'
import { timeAgo } from '../utils'
import { CheckCircle, Pencil, X } from 'lucide-react'
import NotFoundPage from './NotFoundPage'

const HeartIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : 'currentColor'} strokeWidth="1.8">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
)

function Comment({ comment, postId, onDelete, onUpdate }) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [showReply, setShowReplyx] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replies, setReplies] = useState([])
  const [showReplies, setShowReplies] = useState(false)
  const [loading, setLoading] = useState(false)
  const isOwner = user?.id === comment.author_id

  const handleUpdate = async () => {
    if (!editText.trim()) return
    setLoading(true)
    try { const { data } = await commentsAPI.update(comment.id, { content: editText }); onUpdate(comment.id, data); setEditing(false) }
    catch { addToast('Ошибка', 'error') }
    setLoading(false)
  }

  const handleDelete = async () => {
    try { await commentsAPI.delete(comment.id); onDelete(comment.id) }
    catch { addToast('Ошибка', 'error') }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    setLoading(true)
    try {
      const { data } = await postsAPI.createComment(postId, { content: replyText, parent_id: comment.id })
      setReplies(prev => [...prev, data]); setShowReplies(true); setReplyText(''); setShowReply(false)
    } catch { addToast('Ошибка', 'error') }
    setLoading(false)
  }

  const loadReplies = async () => {
    if (showReplies) { setShowReplies(false); return }
    try { const { data } = await commentsAPI.getReplies(comment.id); setReplies(data); setShowReplies(true) }
    catch {}
  }

  return (
    <div style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link to={`/users/${comment.author_id}`} style={{ flexShrink: 0 }}>
          <Avatar user={comment.author} size="sm" />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.5 }}>
              <Link to={`/users/${comment.author_id}`} style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none', marginRight: 6 }}>{comment.author.username}</Link>
              {editing ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4, alignItems: 'center' }}>
                  <input value={editText} onChange={e => setEditText(e.target.value)} className="input" style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} />
                  <button onClick={handleUpdate} disabled={loading} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>{loading ? '...' : 'Сохранить'}</button>
                  <button onClick={() => setEditing(false)} style={{ fontSize: '0.75rem', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>Отмена</button>
                </div>
              ) : <span>{comment.content}</span>}
            </div>
            {isOwner && !editing && (
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button onClick={() => setEditing(true)} style={{ fontSize: '0.75rem', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Pencil size={13} /></button>
                <button onClick={handleDelete} style={{ fontSize: '0.75rem', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={13} /></button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 4 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{timeAgo(comment.created_at)}</span>
            {user && <button onClick={() => setShowReply(p => !p)} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>Ответить</button>}
            {comment.replies_count > 0 && (
              <button onClick={loadReplies} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showReplies ? '▲ Скрыть' : `▼ Ответы (${comment.replies_count})`}
              </button>
            )}
          </div>
          {showReply && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Ответить..."
                className="input" style={{ flex: 1, fontSize: '0.8rem', padding: '0.375rem 0.625rem' }} />
              <button onClick={handleReply} disabled={!replyText.trim() || loading}
                style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', opacity: !replyText.trim() ? 0.4 : 1 }}>
                {loading ? '...' : 'Отправить'}
              </button>
            </div>
          )}
          {showReplies && replies.map(r => (
            <div key={r.id} style={{ marginLeft: '1rem', marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <Avatar user={r.author} size="xs" />
              <div style={{ fontSize: '0.875rem' }}>
                <Link to={`/users/${r.author_id}`} style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none', marginRight: 6 }}>{r.author.username}</Link>
                <span style={{ color: 'var(--text2)' }}>{r.content}</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 2 }}>{timeAgo(r.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()
  const location = useLocation()
  const preloaded = location.state?.post || null
  const [post, setPost] = useState(preloaded)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [liked, setLiked] = useState(preloaded?.is_liked || false)
  const [likesCount, setLikesCount] = useState(preloaded?.likes_count || 0)
  const [loading, setLoading] = useState(!preloaded)
  const [notFound, setNotFound] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
  postsAPI.getById(id)
    .then(r => { setPost(r.data); setLiked(r.data.is_liked); setLikesCount(r.data.likes_count) })
    .catch(() => {
      setNotFound(true)
    })
    .finally(() => setLoading(false))
}, [id])

  const handleLike = async () => {
    if (!user) { navigate('/login'); return }
    const next = !liked; setLiked(next); setLikesCount(c => next ? c + 1 : c - 1)
    try { const { data } = await postsAPI.toggleLike(id); setLiked(data.liked); setLikesCount(data.likes_count) }
    catch { setLiked(!next); setLikesCount(c => next ? c - 1 : c + 1) }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentLoading(true)
    try {
      const { data } = await postsAPI.createComment(id, { content: commentText })
      setComments(prev => [...prev, data]); setCommentText('')
      setPost(p => ({ ...p, comments_count: p.comments_count + 1 }))
    } catch { addToast('Ошибка', 'error') }
    setCommentLoading(false)
  }

  const handleDeletePost = async () => {
    if (!window.confirm('Удалить публикацию?')) return
    try { await postsAPI.delete(id); addToast('Публикация удалена'); navigate('/posts') }
    catch { addToast('Ошибка', 'error') }
  }

  if (loading) return <LoadingScreen />
  if (notFound) return <NotFoundPage />
  if (!post) return null
  const isOwner = user?.id === post.author_id
  const imgUrl = post.image_url ? mediaURL(post.image_url) : null

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1.25rem 3rem' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.25rem', padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Назад
      </button>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
          {imgUrl && (
            <div style={{ flex: '0 0 60%', minWidth: 280, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={imgUrl} alt={post.title || ''} style={{ width: '100%', maxHeight: 640, objectFit: 'contain', display: 'block' }} />
            </div>
          )}

          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', minHeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <Link to={`/users/${post.author_id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                <Avatar user={post.author} size="sm" />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {post.author.username}
                  {post.author.is_verified && <span style={{ color: 'var(--accent)', fontSize: 11, display: 'inline-flex' }}><CheckCircle size={12} /></span>}
                </div>
              </Link>
              {isOwner && (
                <div style={{ position: 'relative' }} ref={menuRef}>
                  <button onClick={() => setShowMenu(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, display: 'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                  </button>
                  {showMenu && (
                    <div className="card fade-in" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 160, zIndex: 20, padding: '0.25rem', overflow: 'hidden' }}>
                      <MenuBtn onClick={() => navigate(`/posts/${id}/edit`)}>Редактировать</MenuBtn>
                      <MenuBtn onClick={handleDeletePost} red>Удалить</MenuBtn>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!imgUrl && (
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                {post.title && <h2 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.5rem' }}>{post.title}</h2>}
                <p style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem', maxHeight: 340 }}>
              {imgUrl && (
                <div style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                  <Link to={`/users/${post.author_id}`} style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', textDecoration: 'none', marginRight: 6 }}>{post.author.username}</Link>
                  {post.title && <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', marginRight: 4 }}>{post.title}</span>}
                  <span style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>{post.content}</span>
                </div>
              )}
              {comments.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem', color: 'var(--text3)' }}>Комментариев пока нет</p>
              ) : comments.map(c => (
                <Comment key={c.id} comment={c} postId={id}
                  onDelete={(cid) => setComments(prev => prev.filter(x => x.id !== cid))}
                  onUpdate={(cid, upd) => setComments(prev => prev.map(x => x.id === cid ? { ...x, ...upd } : x))} />
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1rem 0.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', color: liked ? '#ef4444' : 'var(--text2)', display: 'flex' }}>
                  <HeartIcon filled={liked} />
                </button>
              </div>
              {likesCount > 0 && (
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                  {likesCount} {likesCount === 1 ? 'отметка' : 'отметок'} «Нравится»
                </div>
              )}
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>{timeAgo(post.created_at)}</div>
            </div>

            {user && (
              <form onSubmit={handleComment} style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  placeholder="Добавьте комментарий..."
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '0.875rem', fontFamily: 'Montserrat, sans-serif' }} />
                <button type="submit" disabled={!commentText.trim() || commentLoading}
                  style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', opacity: !commentText.trim() ? 0.4 : 1 }}>
                  {commentLoading ? <Spinner size={14} /> : 'Опубл.'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuBtn({ children, onClick, red }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
      background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem',
      color: red ? 'var(--red)' : 'var(--text2)', borderRadius: 6,
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >{children}</button>
  )
}
