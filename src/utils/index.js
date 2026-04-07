import { formatDistanceToNow, format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

const parseDate = (date) => {
  if (!date) return new Date()
  if (date instanceof Date) return date
  const s = String(date)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !s.endsWith('Z') && !s.includes('+')) {
    return new Date(s + 'Z')
  }
  return new Date(s)
}

export const timeAgo = (date) => {
  try {
    return formatDistanceToNow(parseDate(date), { addSuffix: true, locale: ru })
  } catch { return '' }
}

export const formatDate = (date) => {
  try { return format(parseDate(date), 'd MMMM yyyy', { locale: ru }) }
  catch { return '' }
}

export const formatTime = (date) => {
  try { return format(parseDate(date), 'HH:mm', { locale: ru }) }
  catch { return '' }
}

export const getInitials = (name, username) => {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  if (username) return username.slice(0, 2).toUpperCase()
  return '?'
}

export const getApiError = (err) => {
  const detail = err?.response?.data?.detail
  if (!detail) return err?.message || 'Что-то пошло не так'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || d).join(', ')
  return JSON.stringify(detail)
}

export const VISIBILITY_LABELS = {
  public: 'Публичный',
  followers_only: 'Для подписчиков',
  private: 'Приватный',
}
