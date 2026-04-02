import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '5rem', fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'var(--border2)', lineHeight: 1 }}>404</div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', margin: '1rem 0 0.5rem' }}>Страница не найдена</h2>
      <p style={{ color: 'var(--text3)', marginBottom: '2rem', fontSize: '0.9rem' }}>Такой страницы не существует или она была удалена</p>
      <Link to="/feed" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>На главную</Link>
    </div>
  )
}
