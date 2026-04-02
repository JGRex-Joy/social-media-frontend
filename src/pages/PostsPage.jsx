import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { postsAPI } from '../services/api'
import PostCard from '../components/PostCard'
import { LoadingScreen, EmptyState, Pagination, PageHeader } from '../components/ui'
import { FileText, X } from 'lucide-react'

const POSTS_CACHE_KEY = 'postsPage_cache'

export default function PostsPage() {
  const getCached = () => { try { return JSON.parse(sessionStorage.getItem(POSTS_CACHE_KEY)) } catch { return null } }
  const cached = getCached()

  const [posts, setPosts] = useState(cached?.posts || [])
  const [total, setTotal] = useState(cached?.total || 0)
  const [page, setPage] = useState(cached?.page || 1)
  const [pages, setPages] = useState(cached?.pages || 1)
  const [loading, setLoading] = useState(!cached)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const debounceRef = useRef(null)

  const fetchPosts = useCallback(async (p = 1, q = search) => {
    try {
      const { data } = await postsAPI.list({ page: p, size: 12, q })
      let items = [...data.items]
      if (sort === 'popular') items.sort((a, b) => b.likes_count - a.likes_count)
      else if (sort === 'oldest') items.reverse()
      setPosts(items); setTotal(data.total); setPages(data.pages); setPage(p)
      try { sessionStorage.setItem(POSTS_CACHE_KEY, JSON.stringify({ posts: items, total: data.total, pages: data.pages, page: p })) } catch {}
    } catch {}
    setLoading(false)
  }, [search, sort])

  useEffect(() => { fetchPosts(1, search) }, [search, sort])

  const handleSearchChange = (val) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(val), 300)
  }
  const handleDelete = (id) => setPosts(prev => prev.filter(p => p.id !== id))
  const handleLike = (id, data) => setPosts(prev => prev.map(p =>
    p.id === id ? { ...p, is_liked: data.liked, likes_count: data.likes_count } : p
  ))

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1.25rem 3rem' }}>
      <PageHeader
        title="Публикации"
        subtitle={total > 0 ? `${total} публикаций` : ''}
        action={<Link to="/posts/create" className="btn-primary">+ Создать</Link>}
      />

      {/* Search & filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            defaultValue={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Поиск публикаций..."
            className="input" style={{ paddingLeft: 34 }} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="input" style={{ width: 'auto', cursor: 'pointer' }}>
          <option value="newest">Новые</option>
          <option value="oldest">Старые</option>
          <option value="popular">Популярные</option>
        </select>
        {search && (
          <button type="button" onClick={() => { setSearch('') }} className="btn-ghost" style={{ padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center' }}><X size={16} /></button>
        )}
      </div>

      {loading ? <LoadingScreen /> : posts.length === 0 ? (
        <EmptyState icon={<FileText size={48} />} title="Нет публикаций" description={search ? `По запросу «${search}» ничего не найдено` : 'Пока никто ничего не опубликовал'} />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onDelete={handleDelete} onLikeToggle={handleLike} />
            ))}
          </div>
          <Pagination page={page} pages={pages} onPage={(p) => fetchPosts(p)} />
        </>
      )}
    </div>
  )
}
