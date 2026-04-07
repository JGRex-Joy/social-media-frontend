import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MessageSquare, Camera, Users } from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()

  if (user) {
    window.location.replace('/feed')
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '20%', width: 500, height: 500, background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '20%', width: 350, height: 350, background: 'rgba(224,64,251,0.1)', borderRadius: '50%', filter: 'blur(100px)' }} />
      </div>

      <div style={{ textAlign: 'center', maxWidth: 520, position: 'relative' }}>
        <h1 className="logo-font" style={{ fontSize: 'clamp(3rem, 10vw, 5.5rem)', color: 'var(--text)', lineHeight: 1, marginBottom: '1rem' }}>pulse</h1>
        <p style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          Общайтесь, делитесь и открывайте новое вместе с людьми по всему миру
        </p>

        <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Начать бесплатно
          </Link>
          <Link to="/login" className="btn-ghost" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Войти
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem', flexWrap: 'wrap' }}>
          {[[<MessageSquare size={18} />, 'Чат в реальном времени'], [<Camera size={18} />, 'Делитесь моментами'], [<Users size={18} />, 'Находите друзей']].map(([icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text3)', fontSize: '0.875rem' }}>
              {icon} {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
