import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Spinner } from '../components/ui'
import { getApiError } from '../utils'

export default function RegisterPage() {
  const { register, login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [values, setValues] = useState({ email: '', full_name: '', username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = (v) => {
    const e = {}
    if (!v.email.trim()) e.email = 'Введите email'
    else if (!/\S+@\S+\.\S+/.test(v.email)) e.email = 'Некорректный email'
    if (!v.username.trim()) e.username = 'Введите имя пользователя'
    else if (!/^[a-zA-Z0-9_]+$/.test(v.username)) e.username = 'Только латиница, цифры и _'
    else if (v.username.length < 3) e.username = 'Минимум 3 символа'
    if (!v.password) e.password = 'Введите пароль'
    else if (v.password.length < 8) e.password = 'Минимум 8 символов'
    else if (!/[A-Z]/.test(v.password)) e.password = 'Нужна заглавная буква'
    else if (!/[0-9]/.test(v.password)) e.password = 'Нужна цифра'
    return e
  }

  const handleChange = (e) => {
    setValues(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await register(values)
      await login({ username: values.username, password: values.password })
      addToast('Добро пожаловать в Pulse!')
      navigate('/feed')
    } catch (err) {
      addToast(getApiError(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  const strength = (() => {
    const p = values.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const strengthColor = strength <= 1 ? 'var(--red)' : strength === 2 ? 'var(--yellow)' : 'var(--green)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '15%', right: '15%', width: 350, height: 350, background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '15%', width: 280, height: 280, background: 'rgba(224,64,251,0.08)', borderRadius: '50%', filter: 'blur(80px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="logo-font" style={{ fontSize: '3rem', color: 'var(--text)', marginBottom: '0.5rem' }}>pulse</h1>
          <p style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>Создайте аккаунт и общайтесь с друзьями</p>
        </div>

        <div className="card" style={{ padding: '2rem', marginBottom: '1rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <Field name="email" type="email" placeholder="Адрес эл. почты" value={values.email} onChange={handleChange} error={errors.email} />
            <Field name="full_name" placeholder="Полное имя" value={values.full_name} onChange={handleChange} error={errors.full_name} />
            <Field name="username" placeholder="Имя пользователя" value={values.username} onChange={handleChange} error={errors.username} hint="Только латиница, цифры и _" />

            <div>
              <input name="password" type="password" value={values.password} onChange={handleChange}
                placeholder="Пароль" autoComplete="new-password" className="input"
                style={errors.password ? { borderColor: 'var(--red)' } : {}}
              />
              {values.password && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= strength ? strengthColor : 'var(--border2)', transition: 'background 0.2s' }} />
                  ))}
                </div>
              )}
              {errors.password && <p style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 4 }}>{errors.password}</p>}
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text3)', textAlign: 'center' }}>
              Регистрируясь, вы соглашаетесь с нашими условиями использования.
            </p>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
              {loading ? <Spinner size={18} color="#fff" /> : 'Зарегистрироваться'}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>Уже есть аккаунт? </span>
          <Link to="/login" style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Войти</Link>
        </div>
      </div>
    </div>
  )
}

function Field({ name, type = 'text', placeholder, value, onChange, error, hint }) {
  return (
    <div>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        autoComplete={name} className="input" style={error ? { borderColor: 'var(--red)' } : {}} />
      {error && <p style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 4 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}
