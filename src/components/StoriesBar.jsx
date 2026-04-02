import React, { useEffect, useRef, useState } from 'react'
import { storiesAPI, mediaURL } from '../services/api'
import { useToast } from '../context/ToastContext'
import Avatar from './Avatar'
import { Spinner } from './ui'
import { Camera, X } from 'lucide-react'

function StoryViewer({ stories, startIndex, onClose, onDelete, currentUserId }) {
  const [idx, setIdx] = useState(startIndex)
  const [progress, setProgress] = useState(0)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const intervalRef = useRef(null)
  const { addToast } = useToast()
  const story = stories[idx]
  const DURATION = 5000

  const startTimer = () => {
    setProgress(0)
    clearInterval(intervalRef.current)
    const start = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) { clearInterval(intervalRef.current); if (idx < stories.length - 1) setIdx(i => i + 1); else onClose() }
    }, 50)
  }

  useEffect(() => { startTimer(); return () => clearInterval(intervalRef.current) }, [idx])

  const prev = () => { if (idx > 0) { clearInterval(intervalRef.current); setIdx(i => i - 1) } }
  const next = () => { clearInterval(intervalRef.current); if (idx < stories.length - 1) setIdx(i => i + 1); else onClose() }

  const handleDelete = async () => {
    try { await storiesAPI.delete(story.id); addToast('История удалена'); onDelete(story.id); onClose() }
    catch { addToast('Ошибка при удалении', 'error') }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSending(true)
    try { await storiesAPI.addComment(story.id, { content: comment.trim() }); setComment(''); addToast('Комментарий отправлен') }
    catch { addToast('Ошибка', 'error') }
    setSending(false)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 380, maxHeight: '90vh', aspectRatio: '9/16', background: '#000', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        {/* Progress bars */}
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', gap: 4, zIndex: 10 }}>
          {stories.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#fff', borderRadius: 999, width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }} />
            </div>
          ))}
        </div>
        {/* Header */}
        <div style={{ position: 'absolute', top: 22, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}>
          <Avatar user={story.author} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}>{story.author?.username}</div>
          </div>
          {story.author_id === currentUserId && (
            <button onClick={handleDelete} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: 999, padding: '2px 8px', cursor: 'pointer' }}>Удалить</button>
          )}
          <button onClick={onClose} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, display: 'flex' }}><X size={20} /></button>
        </div>
        {/* Image */}
        <img src={mediaURL(story.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Caption */}
        {story.caption && (
          <div style={{ position: 'absolute', bottom: 70, left: 12, right: 12, zIndex: 10 }}>
            <p style={{ color: '#fff', fontSize: '0.875rem', textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '8px 12px', backdropFilter: 'blur(4px)' }}>{story.caption}</p>
          </div>
        )}
        {/* Comment */}
        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 10 }}>
          <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={comment} onChange={e => setComment(e.target.value)} onClick={e => e.stopPropagation()}
              placeholder="Ответить..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, padding: '8px 16px', color: '#fff', fontSize: '0.875rem', backdropFilter: 'blur(4px)' }} />
            <button type="submit" disabled={sending || !comment.trim()} onClick={e => e.stopPropagation()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>
        {/* Tap zones */}
        <button style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '33%', background: 'none', border: 'none', cursor: 'pointer', zIndex: 5 }} onClick={prev} />
        <button style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '33%', background: 'none', border: 'none', cursor: 'pointer', zIndex: 5 }} onClick={next} />
      </div>
    </div>
  )
}

function CreateStoryModal({ onClose, onCreated }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()
  const { addToast } = useToast()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { addToast('Только изображения', 'error'); return }
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    if (!file) { addToast('Выберите изображение', 'error'); return }
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      if (caption.trim()) fd.append('caption', caption.trim())
      const { data } = await storiesAPI.create(fd)
      addToast('История опубликована!'); onCreated(data); onClose()
    } catch (err) { addToast(err?.response?.data?.detail || 'Ошибка', 'error') }
    setUploading(false)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.875rem' }}>Отмена</button>
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Новая история</h3>
          <button onClick={handleSubmit} disabled={!file || uploading} className="btn-primary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
            {uploading ? <Spinner size={14} color="#fff" /> : 'Поделиться'}
          </button>
        </div>

        <div style={{ aspectRatio: '9/16', maxHeight: 320, background: 'var(--bg3)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', position: 'relative' }}
          onClick={() => fileRef.current?.click()}>
          {preview ? (
            <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}><Camera size={40} /></div>
              <p style={{ fontSize: '0.875rem' }}>Нажмите, чтобы выбрать фото</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.6 }}>JPEG, PNG, GIF до 10 МБ</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

        <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Подпись (необязательно)" maxLength={200} className="input" style={{ marginBottom: '0.5rem' }} />
        <p style={{ fontSize: '0.7rem', color: 'var(--text3)', textAlign: 'right' }}>{caption.length}/200</p>
      </div>
    </div>
  )
}

export default function StoriesBar({ currentUser }) {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => { loadStories() }, [])

  const loadStories = async () => {
    try { const { data } = await storiesAPI.list({ page: 1, size: 30 }); setStories(data.items || []) }
    catch {} finally { setLoading(false) }
  }

  const authorMap = new Map()
  stories.forEach((s, i) => { if (!authorMap.has(s.author_id)) authorMap.set(s.author_id, i) })
  const uniqueAuthors = [...authorMap.entries()]

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', overflowX: 'auto' }} className="no-scrollbar">
        {/* Add story */}
        <button onClick={() => setCreateOpen(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg3)', border: '2px dashed var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--accent)', transition: 'all 0.15s' }}>+</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text3)', width: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Моя история</span>
        </button>

        {loading ? <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}><Spinner size={20} /></div> : (
          uniqueAuthors.map(([authorId, storyIdx]) => {
            const s = stories[storyIdx]
            return (
              <button key={authorId} onClick={() => { setViewerIndex(storyIdx); setViewerOpen(true) }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
                <Avatar user={s.author} size="lg" ring />
                <span style={{ fontSize: '0.7rem', color: 'var(--text2)', width: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.author?.username}
                </span>
              </button>
            )
          })
        )}
      </div>

      {viewerOpen && stories.length > 0 && (
        <StoryViewer stories={stories} startIndex={viewerIndex} onClose={() => setViewerOpen(false)}
          onDelete={(id) => setStories(p => p.filter(s => s.id !== id))} currentUserId={currentUser?.id} />
      )}
      {createOpen && <CreateStoryModal onClose={() => setCreateOpen(false)} onCreated={(s) => setStories(p => [s, ...p])} />}
    </>
  )
}
