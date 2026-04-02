import React from 'react'
import { Inbox } from 'lucide-react'

export function Spinner({ size = 24, color = 'var(--accent)' }) {
  return (
    <svg className="spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}

export function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Spinner size={32} />
    </div>
  )
}

export function EmptyState({ icon, title = 'Пусто', description = '' }) {
  const defaultIcon = <Inbox size={48} />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text3)', textAlign: 'center', gap: '0.75rem' }}>
      <div style={{ lineHeight: 1, display: 'flex', justifyContent: 'center' }}>{icon || defaultIcon}</div>
      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text2)', fontFamily: 'Montserrat, sans-serif' }}>{title}</p>
      {description && <p style={{ fontSize: '0.875rem' }}>{description}</p>}
    </div>
  )
}

export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null
  const items = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) items.push(i)
    else if (items[items.length - 1] !== '…') items.push('…')
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', padding: '1.5rem 0', flexWrap: 'wrap' }}>
      <PagBtn disabled={page <= 1} onClick={() => onPage(page - 1)}>←</PagBtn>
      {items.map((item, i) =>
        item === '…'
          ? <span key={`e${i}`} style={{ padding: '0.5rem 0.25rem', color: 'var(--text3)' }}>…</span>
          : <PagBtn key={item} active={item === page} onClick={() => onPage(item)}>{item}</PagBtn>
      )}
      <PagBtn disabled={page >= pages} onClick={() => onPage(page + 1)}>→</PagBtn>
    </div>
  )
}

function PagBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 36, height: 36, padding: '0 0.5rem',
        background: active ? 'var(--accent)' : 'var(--bg3)',
        color: active ? '#fff' : 'var(--text2)',
        border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
        borderRadius: 8, cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1, fontSize: '0.875rem', fontWeight: 500,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

export function Card({ children, style = {} }) {
  return (
    <div className="card" style={style}>{children}</div>
  )
}

export function Modal({ children, onClose }) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal">{children}</div>
    </div>
  )
}

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {label && <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <input className="input" {...props} />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

export function Textarea({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {label && <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <textarea className="input" style={{ resize: 'vertical', minHeight: 80 }} {...props} />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
