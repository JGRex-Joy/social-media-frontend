import React, { createContext, useContext, useState, useCallback } from 'react'
import { Check, X, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => remove(toast.id)}
            className={`toast ${toast.type}`}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {toast.type === 'success' && <span style={{ color: 'var(--green)', display: 'flex' }}><Check size={15} /></span>}
              {toast.type === 'error' && <span style={{ color: 'var(--red)', display: 'flex' }}><X size={15} /></span>}
              {toast.type === 'warning' && <span style={{ color: 'var(--yellow)', display: 'flex' }}><AlertTriangle size={15} /></span>}
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
