import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { postsAPI, mediaURL } from '../services/api'
import { useToast } from '../context/ToastContext'
import { LoadingScreen, Spinner, PageHeader } from '../components/ui'
import { getApiError } from '../utils'
import api from '../services/api'
import { Globe, Users, Lock } from 'lucide-react'

const VISIBILITY = [
  { value: 'public', label: 'Все', icon: <Globe size={14} /> },
  { value: 'followers_only', label: 'Подписчики', icon: <Users size={14} /> },
  { value: 'private', label: 'Только я', icon: <Lock size={14} /> },
]

export default function PostFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { addToast } = useToast()
  const fileRef = useRef()

  const [values, setValues] = useState({ title: '', content: '', visibility: 'public' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    postsAPI.getById(id)
      .then(r => {
        setValues({ title: r.data.title || '', content: r.data.content, visibility: r.data.visibility })
        if (r.data.image_url) {
          setImagePreview(mediaURL(r.data.image_url))
          setExistingImageUrl(r.data.image_url)
        }
      })
      .catch(() => { addToast('Пост не найден', 'error'); navigate('/posts') })
      .finally(() => setFetchLoading(false))
  }, [id])

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { addToast('Только изображения', 'error'); return }
    if (f.size > 20 * 1024 * 1024) { addToast('Файл слишком большой (макс. 20 МБ)', 'error'); return }
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
    setExistingImageUrl(null)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setExistingImageUrl(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const validate = () => {
    const e = {}
    if (!values.content.trim()) e.content = 'Добавьте текст публикации'
    if (values.content.length > 5000) e.content = 'Максимум 5000 символов'
    return e
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      // Upload image first if a new file was selected
      let finalImageUrl = existingImageUrl
      if (imageFile) {
        setUploadingImage(true)
        const fd = new FormData()
        fd.append('file', imageFile)
        const { data: uploadData } = await api.post('/posts/upload-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        finalImageUrl = uploadData.image_url
        setUploadingImage(false)
      }

      const payload = {
        content: values.content,
        visibility: values.visibility,
        ...(values.title.trim() ? { title: values.title } : {}),
        ...(finalImageUrl ? { image_url: finalImageUrl } : {}),
      }

      if (isEdit) {
        await postsAPI.update(id, payload)
        addToast('Изменения сохранены')
        navigate(`/posts/${id}`)
      } else {
        const { data } = await postsAPI.create(payload)
        addToast('Публикация создана!')
        try { sessionStorage.removeItem('feedPage_cache'); sessionStorage.removeItem('postsPage_cache') } catch {}
        navigate(`/posts/${data.id}`, { state: { post: data } })
      }
    } catch (err) {
      setUploadingImage(false)
      addToast(getApiError(err), 'error')
    }
    setLoading(false)
  }

  if (fetchLoading) return <LoadingScreen />
  const charCount = values.content.length

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem 1.25rem 3rem' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.25rem', padding: 0 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Назад
      </button>

      <PageHeader title={isEdit ? 'Редактировать публикацию' : 'Новая публикация'} />

      <div className="card" style={{ overflow: 'hidden', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Image upload */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.625rem' }}>
            Фото <span style={{ textTransform: 'none', fontWeight: 400 }}>(необязательно)</span>
          </label>
          {imagePreview ? (
            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={imagePreview} alt="Preview" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.3rem 0.7rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Заменить
                </button>
                <button type="button" onClick={removeImage}
                  style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Удалить
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ width: '100%', border: '2px dashed var(--border2)', borderRadius: 10, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text3)', background: 'none', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)' }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Нажмите для загрузки фото</span>
              <span style={{ fontSize: '0.75rem' }}>JPEG, PNG, GIF, WEBP · до 20 МБ</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {/* Title */}
        <input
          name="title"
          value={values.title}
          onChange={e => setValues(p => ({ ...p, title: e.target.value }))}
          placeholder="Заголовок (необязательно)"
          className="input"
          style={{ fontWeight: 500 }}
        />

        {/* Content */}
        <div>
          <textarea
            name="content"
            value={values.content}
            onChange={e => { setValues(p => ({ ...p, content: e.target.value })); setErrors(p => ({ ...p, content: '' })) }}
            placeholder="Напишите текст публикации..."
            rows={5}
            maxLength={5000}
            className="input"
            style={{ resize: 'vertical', borderColor: errors.content ? 'var(--red)' : undefined }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {errors.content
              ? <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>{errors.content}</span>
              : <span />}
            <span style={{ fontSize: '0.75rem', color: charCount > 5000 ? 'var(--red)' : 'var(--text3)' }}>{charCount}/5000</span>
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.625rem' }}>
            Кто видит
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {VISIBILITY.map(v => (
              <button key={v.value} type="button" onClick={() => setValues(p => ({ ...p, visibility: v.value }))}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${values.visibility === v.value ? 'var(--accent)' : 'var(--border2)'}`,
                  background: values.visibility === v.value ? 'var(--accent-glow)' : 'transparent',
                  color: values.visibility === v.value ? 'var(--accent)' : 'var(--text3)',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || charCount > 5000}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
        >
          {uploadingImage
            ? <><Spinner size={16} color="#fff" /> Загрузка фото...</>
            : loading
              ? <Spinner size={16} color="#fff" />
              : isEdit ? 'Сохранить изменения' : 'Опубликовать'
          }
        </button>
      </div>
    </div>
  )
}
