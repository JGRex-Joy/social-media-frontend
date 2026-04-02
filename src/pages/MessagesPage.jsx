import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { messagesAPI, usersAPI, mediaURL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Avatar from '../components/Avatar'
import { timeAgo, formatTime } from '../utils'

export default function MessagesPage() {
  const { userId } = useParams()
  const { user: me } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [inboxLoading, setInboxLoading] = useState(true)
  const [activeUser, setActiveUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)
  const fileRef = useRef(null)

  // Load inbox + all users at once
  const loadInbox = useCallback(async () => {
    try {
      const [inboxR, usersR] = await Promise.all([
        messagesAPI.inbox(),
        usersAPI.list({ page: 1, size: 100 }),
      ])
      setConversations(inboxR.data)
      setAllUsers(usersR.data.items.filter(u => u.id !== me?.id))
    } catch {}
    setInboxLoading(false)
  }, [me?.id])

  useEffect(() => { loadInbox() }, [loadInbox])

  // Load conversation when userId changes
  useEffect(() => {
    if (!userId) { setActiveUser(null); setMessages([]); return }
    loadConversation(userId)
    pollRef.current = setInterval(() => loadConversationSilent(userId), 5000)
    return () => clearInterval(pollRef.current)
  }, [userId])

  const loadConversation = async (uid) => {
    setMsgLoading(true)
    try {
      const [convR, userR] = await Promise.all([
        messagesAPI.getConversation(uid, { page: 1, size: 50 }),
        usersAPI.getById(uid),
      ])
      setMessages(convR.data.items.reverse())
      setActiveUser(userR.data)
    } catch { navigate('/messages') }
    setMsgLoading(false)
  }

  const loadConversationSilent = async (uid) => {
    try {
      const { data } = await messagesAPI.getConversation(uid, { page: 1, size: 50 })
      setMessages(data.items.reverse())
      loadInbox()
    } catch {}
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!text.trim() || !userId || sending) return
    setSending(true)
    try {
      const { data } = await messagesAPI.send(userId, { content: text.trim() })
      setMessages(prev => [...prev, data])
      setText('')
      loadInbox()
    } catch { addToast('Не удалось отправить сообщение', 'error') }
    setSending(false)
  }

  const sendImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    const fd = new FormData(); fd.append('file', file)
    try {
      const { data } = await messagesAPI.sendImage(userId, fd)
      setMessages(prev => [...prev, data])
      loadInbox()
    } catch { addToast('Не удалось отправить изображение', 'error') }
    e.target.value = ''
  }

  const deleteMsg = async (msgId) => {
    try {
      await messagesAPI.delete(msgId)
      setMessages(prev => prev.filter(m => m.id !== msgId))
    } catch {}
  }

  const openConversation = (uid) => {
    navigate(`/messages/${uid}`)
    setSearchQ('')
  }

  const isMine = (msg) => msg.sender_id === me?.id

  // Conversation ids set for "Поздоровайтесь!" logic
  const conversationUserIds = new Set(conversations.map(c => String(c.user.id)))

  // Filtered user list for sidebar: search instantly
  const q = searchQ.trim().toLowerCase()
  const filteredUsers = q
    ? allUsers.filter(u =>
        u.username.toLowerCase().includes(q) ||
        (u.full_name || '').toLowerCase().includes(q)
      )
    : allUsers

  // Build merged sidebar list: existing convos first, then users without convos
  const usersWithConvo = conversations.map(c => c.user.id)
  const usersWithoutConvo = filteredUsers.filter(u => !usersWithConvo.includes(u.id))

  // Group messages by date
  const grouped = groupByDate(messages)

  return (
    <div className="chat-layout" style={{ height: '100vh' }}>
      {/* Sidebar */}
      <div className={`chat-sidebar ${userId ? 'hidden-mobile' : ''}`}>
        <div style={{ padding: '1.25rem 1rem 0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'Syne, sans-serif' }}>
            Сообщения
          </h2>
          {/* Instant search */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              className="input"
              style={{ paddingLeft: 34, fontSize: '0.8rem' }}
              placeholder="Поиск пользователей..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            {searchQ && (
              <button onClick={() => setSearchQ('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2, display: 'flex' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        <div className="divider" />

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {inboxLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 13, width: '55%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 11, width: '75%' }} />
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Existing conversations */}
              {!q && conversations.map(conv => {
                const isActive = String(conv.user.id) === String(userId)
                const unread = conv.unread_count > 0
                return (
                  <ConvoRow
                    key={conv.user.id}
                    user={conv.user}
                    isActive={isActive}
                    unread={unread}
                    unreadCount={conv.unread_count}
                    lastMsg={conv.last_message}
                    meId={me?.id}
                    onClick={() => openConversation(conv.user.id)}
                    isNew={false}
                  />
                )
              })}

              {/* All other users (no conversation yet) */}
              {!q && usersWithoutConvo.length > 0 && (
                <>
                  {conversations.length > 0 && <div className="divider" style={{ margin: '0.25rem 0' }} />}
                  <div style={{ padding: '0.375rem 1rem 0.25rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Все пользователи
                  </div>
                  {usersWithoutConvo.map(u => (
                    <ConvoRow
                      key={u.id}
                      user={u}
                      isActive={String(u.id) === String(userId)}
                      unread={false}
                      unreadCount={0}
                      lastMsg={null}
                      meId={me?.id}
                      onClick={() => openConversation(u.id)}
                      isNew={true}
                    />
                  ))}
                </>
              )}

              {/* Search results */}
              {q && (
                filteredUsers.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text3)', fontSize: '0.875rem' }}>
                    Никого не найдено
                  </div>
                ) : filteredUsers.map(u => (
                  <ConvoRow
                    key={u.id}
                    user={u}
                    isActive={String(u.id) === String(userId)}
                    unread={false}
                    unreadCount={0}
                    lastMsg={conversations.find(c => c.user.id === u.id)?.last_message || null}
                    meId={me?.id}
                    onClick={() => openConversation(u.id)}
                    isNew={!conversationUserIds.has(String(u.id))}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat main */}
      <div className="chat-main" style={{ background: 'var(--bg)' }}>
        {!userId ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', gap: '0.75rem' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>Выберите диалог</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>или найдите пользователя слева</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
              <button onClick={() => navigate('/messages')}
                style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 4, display: 'flex' }}
                className="hidden-desktop">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              {activeUser && (
                <Link to={`/users/${activeUser.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
                  <Avatar user={activeUser} size="md" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{activeUser.full_name || activeUser.username}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>@{activeUser.username}</div>
                  </div>
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {msgLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2rem' }}>
                  <svg className="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                  </svg>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', gap: '0.75rem' }}>
                  <div style={{ fontSize: '2.5rem' }}>👋</div>
                  <p style={{ fontWeight: 600, color: 'var(--text2)' }}>
                    {activeUser ? `Напишите ${activeUser.full_name || activeUser.username}!` : 'Начните диалог'}
                  </p>
                  <p style={{ fontSize: '0.8rem' }}>Станьте первым, кто поздоровается</p>
                  {activeUser && (
                    <button
                      className="btn-ghost"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => { setText('Привет! 👋'); }}
                    >
                      👋 Поздороваться
                    </button>
                  )}
                </div>
              ) : (
                grouped.map(({ date, msgs }) => (
                  <div key={date}>
                    <div style={{ textAlign: 'center', margin: '0.75rem 0', fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 500 }}>{date}</div>
                    {msgs.map((msg, i) => {
                      const mine = isMine(msg)
                      const showAvatar = !mine && (i === 0 || isMine(msgs[i - 1]))
                      return (
                        <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                          {!mine && (
                            <div style={{ width: 28, flexShrink: 0 }}>
                              {showAvatar && <Avatar user={activeUser} size="xs" />}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', gap: 2 }}>
                            <div
                              className={`msg-bubble ${mine ? 'mine' : 'theirs'}`}
                              onDoubleClick={() => mine && deleteMsg(msg.id)}
                              title={mine ? 'Двойной клик для удаления' : ''}
                            >
                              {msg.image_url && (
                                <img src={mediaURL(msg.image_url)} alt="img"
                                  style={{ maxWidth: 220, borderRadius: 8, display: 'block', marginBottom: msg.content && msg.content !== '📷 Image' ? 6 : 0 }} />
                              )}
                              {msg.content && msg.content !== '📷 Image' && <span>{msg.content}</span>}
                            </div>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text3)', marginBottom: 2 }}>
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="chat-input-bar" onSubmit={sendMessage}>
              <input ref={fileRef} type="file" accept="image/*" onChange={sendImage} style={{ display: 'none' }} />
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 6, display: 'flex', flexShrink: 0, borderRadius: 8 }}
                title="Отправить изображение">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              </button>
              <textarea
                className="input" rows={1}
                style={{ resize: 'none', flex: 1, maxHeight: 120, lineHeight: 1.6, borderRadius: 10, minHeight: 40, overflowWrap: 'break-word', wordBreak: 'normal' }}
                placeholder="Написать сообщение..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }}
              />
              <button type="submit" className="btn-primary" disabled={!text.trim() || sending}
                style={{ padding: '0.625rem 1rem', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// Reusable sidebar row
function ConvoRow({ user, isActive, unread, unreadCount, lastMsg, meId, onClick, isNew }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.625rem 1rem', width: '100%',
        background: isActive ? 'var(--accent-glow)' : 'none',
        border: 'none', cursor: 'pointer', transition: 'background 0.12s', textAlign: 'left',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg3)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar user={user} size="md" />
        {unread && <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, background: 'var(--accent)', borderRadius: '50%', border: '2px solid var(--bg2)' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: unread ? 700 : 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
            {user.full_name || user.username}
          </span>
          {lastMsg && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text3)', flexShrink: 0 }}>
              {timeAgo(lastMsg.created_at)}
            </span>
          )}
        </div>
        {isNew ? (
          <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>
            👋 Поздоровайтесь!
          </span>
        ) : lastMsg ? (
          <div style={{ fontSize: '0.8rem', color: unread ? 'var(--text2)' : 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', display: 'block' }}>
            {lastMsg.sender_id === meId ? 'Вы: ' : ''}{(lastMsg.content || '📷 Фото').replace(/\n/g, ' ')}
          </div>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>@{user.username}</span>
        )}
        {unreadCount > 0 && (
          <span className="badge" style={{ marginTop: 2, fontSize: 9 }}>{unreadCount}</span>
        )}
      </div>
    </button>
  )
}

function groupByDate(messages) {
  const map = {}
  messages.forEach(msg => {
    const d = new Date(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(msg.created_at) && !msg.created_at.endsWith('Z') && !msg.created_at.includes('+')
        ? msg.created_at + 'Z'
        : msg.created_at
    )
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    let label
    if (d.toDateString() === today.toDateString()) label = 'Сегодня'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Вчера'
    else label = d.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!map[label]) map[label] = []
    map[label].push(msg)
  })
  return Object.entries(map).map(([date, msgs]) => ({ date, msgs }))
}
