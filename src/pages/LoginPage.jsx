import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Spinner } from '../components/ui'
import { getApiError } from '../utils'

export default function LoginPage() {
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/feed'

  const [values, setValues] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setValues(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!values.username.trim()) errs.username = 'Введите логин'
    if (!values.password) errs.password = 'Введите пароль'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await login(values)
      navigate(from, { replace: true })
    } catch (err) {
      addToast(getApiError(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300, background: 'rgba(224,64,251,0.1)', borderRadius: '50%', filter: 'blur(80px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="logo-font" style={{ fontSize: '3rem', color: 'var(--text)', marginBottom: '0.5rem' }}>pulse</h1>
          <p style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>Войдите, чтобы общаться с друзьями</p>
        </div>

        <div className="card" style={{ padding: '2rem', marginBottom: '1rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <input
                name="username"
                value={values.username}
                onChange={handleChange}
                placeholder="Логин или эл. адрес"
                autoComplete="username"
                className="input"
                style={errors.username ? { borderColor: 'var(--red)' } : {}}
              />
              {errors.username && <p style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 4 }}>{errors.username}</p>}
            </div>
            <div>
              <input
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                placeholder="Пароль"
                autoComplete="current-password"
                className="input"
                style={errors.password ? { borderColor: 'var(--red)' } : {}}
              />
              {errors.password && <p style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 4 }}>{errors.password}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.25rem' }}>
              {loading ? <Spinner size={18} color="#fff" /> : 'Войти'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
            <div className="divider" style={{ flex: 1 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 600 }}>ИЛИ</span>
            <div className="divider" style={{ flex: 1 }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link to="/register" style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Создать аккаунт</Link>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>Нет аккаунта? </span>
          <Link to="/register" style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  )
}
