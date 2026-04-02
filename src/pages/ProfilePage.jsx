import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usersAPI, postsAPI, mediaURL } from '../services/api'
import Avatar from '../components/Avatar'
import { Spinner, PageHeader } from '../components/ui'
import { getApiError } from '../utils'
import { Camera } from 'lucide-react'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { addToast } = useToast()
  const fileRef = useRef()

  const [tab, setTab] = useState('profile')
  const [liveStats, setLiveStats] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    usersAPI.getById(user.id)
      .then(r => setLiveStats(r.data))
      .catch(() => {})
  }, [user?.id])
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', bio: user?.bio || '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [pass, setPass] = useState({ current_password: '', new_password: '', confirm: '' })
  const [passErrors, setPassErrors] = useState({})
  const [passLoading, setPassLoading] = useState(false)

  const currentAvatar = avatarPreview || (user?.avatar_url ? mediaURL(user.avatar_url) : null)

  const handleAvatarFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { addToast('Только изображения', 'error'); return }
    if (f.size > 5 * 1024 * 1024) { addToast('Файл слишком большой (макс. 5 МБ)', 'error'); return }
    setAvatarPreview(URL.createObjectURL(f))
    setAvatarUploading(true)
    try {
      const fd = new FormData(); fd.append('file', f)
      const { data } = await usersAPI.uploadAvatar(fd)
      updateUser(data); setAvatarPreview(null); addToast('Аватар обновлён!')
    } catch (err) { setAvatarPreview(null); addToast(getApiError(err), 'error') }
    setAvatarUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault(); setProfileLoading(true)
    try {
      const { data } = await usersAPI.updateMe({ full_name: profile.full_name || null, bio: profile.bio || null })
      updateUser(data); addToast('Профиль сохранён')
    } catch (err) { addToast(getApiError(err), 'error') }
    setProfileLoading(false)
  }

  const validatePass = () => {
    const e = {}
    if (!pass.current_password) e.current_password = 'Введите текущий пароль'
    if (!pass.new_password) e.new_password = 'Введите новый пароль'
    else if (pass.new_password.length < 8) e.new_password = 'Минимум 8 символов'
    else if (!/[A-Z]/.test(pass.new_password)) e.new_password = 'Нужна заглавная буква'
    else if (!/[0-9]/.test(pass.new_password)) e.new_password = 'Нужна цифра'
    if (pass.new_password !== pass.confirm) e.confirm = 'Пароли не совпадают'
    return e
  }

  const handlePassSubmit = async (e) => {
    e.preventDefault()
    const errs = validatePass()
    if (Object.keys(errs).length) { setPassErrors(errs); return }
    setPassLoading(true)
    try {
      await usersAPI.updatePassword({ current_password: pass.current_password, new_password: pass.new_password })
      addToast('Пароль изменён'); setPass({ current_password: '', new_password: '', confirm: '' }); setPassErrors({})
    } catch (err) { addToast(getApiError(err), 'error') }
    setPassLoading(false)
  }

  const TABS = [{ key: 'profile', label: 'Профиль' }, { key: 'password', label: 'Безопасность' }]

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem 1.25rem 3rem' }}>
      <PageHeader title="Настройки" />

      {/* Live stats */}
      {liveStats && (
        <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          {[
            { label: 'Публикаций', value: liveStats.posts_count },
            { label: 'Подписчиков', value: liveStats.followers_count },
            { label: 'Подписок', value: liveStats.following_count },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: 'var(--text)' }}>{s.value ?? 0}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600,
            background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
            marginBottom: -1, cursor: 'pointer', color: tab === t.key ? 'var(--accent)' : 'var(--text3)', transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Avatar section */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1rem' }}>Аватар</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {currentAvatar ? (
                  <img src={currentAvatar} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border2)' }} />
                ) : (
                  <Avatar user={user} size="xl" />
                )}
                {avatarUploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spinner size={20} color="#fff" />
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: 2 }}>{user?.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: '0.75rem' }}>{user?.email}</div>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                  style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: avatarUploading ? 0.5 : 1 }}>
                  {avatarUploading ? 'Загружаем...' : <><Camera size={14} style={{ display: 'inline', marginRight: 4 }} />Загрузить фото</>}
                </button>
                <p style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 4 }}>JPEG, PNG, GIF · до 5 МБ</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
          </div>

          {/* Profile form */}
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormField label="Полное имя">
              <input name="full_name" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Ваше имя" className="input" maxLength={100} />
            </FormField>
            <FormField label="О себе">
              <textarea name="bio" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                placeholder="Расскажите о себе..." rows={3} maxLength={500}
                className="input" style={{ resize: 'vertical' }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textAlign: 'right', marginTop: 4 }}>{profile.bio.length}/500</div>
            </FormField>
            <button type="submit" disabled={profileLoading} className="btn-primary" style={{ justifyContent: 'center', padding: '0.75rem' }}>
              {profileLoading ? <Spinner size={16} color="#fff" /> : 'Сохранить изменения'}
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <form onSubmit={handlePassSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <PassField label="Текущий пароль" name="current_password" value={pass.current_password}
            error={passErrors.current_password} onChange={(v) => { setPass(p => ({ ...p, current_password: v })); setPassErrors(p => ({ ...p, current_password: '' })) }} />
          <PassField label="Новый пароль" name="new_password" value={pass.new_password}
            error={passErrors.new_password} hint="Минимум 8 символов, заглавная буква и цифра"
            onChange={(v) => { setPass(p => ({ ...p, new_password: v })); setPassErrors(p => ({ ...p, new_password: '' })) }} />
          <PassField label="Повторите пароль" name="confirm" value={pass.confirm}
            error={passErrors.confirm}
            onChange={(v) => { setPass(p => ({ ...p, confirm: v })); setPassErrors(p => ({ ...p, confirm: '' })) }} />
          <button type="submit" disabled={passLoading} className="btn-primary" style={{ justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }}>
            {passLoading ? <Spinner size={16} color="#fff" /> : 'Изменить пароль'}
          </button>
        </form>
      )}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.375rem' }}>{label}</label>
      {children}
    </div>
  )
}

function PassField({ label, name, value, error, hint, onChange }) {
  return (
    <FormField label={label}>
      <input name={name} type="password" value={value} onChange={e => onChange(e.target.value)}
        placeholder="••••••••" className="input" style={error ? { borderColor: 'var(--red)' } : {}} />
      {error && <p style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 4 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>{hint}</p>}
    </FormField>
  )
}
