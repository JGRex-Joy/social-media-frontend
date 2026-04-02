import React from 'react'
import { getInitials } from '../utils'
import { mediaURL } from '../services/api'

const COLORS = ['#7c6af7', '#e040fb', '#ff6b6b', '#4fc3f7', '#81c784', '#ffb74d']

const SIZES = {
  xs: { px: 28, text: 10 },
  sm: { px: 32, text: 12 },
  md: { px: 40, text: 14 },
  lg: { px: 56, text: 18 },
  xl: { px: 80, text: 24 },
  '2xl': { px: 112, text: 32 },
}

export default function Avatar({ user, size = 'md', ring = false }) {
  const s = SIZES[size] || SIZES.md
  const color = COLORS[(user?.id || 0) % COLORS.length]
  const initials = getInitials(user?.full_name, user?.username)
  const avatarSrc = user?.avatar_url ? mediaURL(user.avatar_url) : null

  const inner = avatarSrc ? (
    <img
      src={avatarSrc}
      alt={user?.username}
      style={{ width: s.px, height: s.px, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }}
      onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }}
    />
  ) : (
    <div style={{
      width: s.px, height: s.px, borderRadius: '50%',
      background: color, color: '#fff', fontSize: s.text,
      fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontFamily: 'Montserrat, sans-serif',
    }}>
      {initials}
    </div>
  )

  if (ring) {
    return (
      <div className="story-ring" style={{ flexShrink: 0 }}>
        <div className="story-ring-inner">{inner}</div>
      </div>
    )
  }

  return <div style={{ flexShrink: 0, display: 'inline-flex' }}>{inner}</div>
}
