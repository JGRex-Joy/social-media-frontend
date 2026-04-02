import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login: (d) => api.post('/auth/login', d),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

export const usersAPI = {
  list: (p) => api.get('/users/', { params: p }),
  getMe: () => api.get('/users/me'),
  updateMe: (d) => api.put('/users/me', d),
  updatePassword: (d) => api.put('/users/me/password', d),
  uploadAvatar: (formData) => api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getById: (id) => api.get(`/users/${id}`),
  follow: (id) => api.post(`/users/${id}/follow`),
  unfollow: (id) => api.delete(`/users/${id}/follow`),
  getFollowers: (id, p) => api.get(`/users/${id}/followers`, { params: p }),
  getFollowing: (id, p) => api.get(`/users/${id}/following`, { params: p }),
}

export const postsAPI = {
  list: (p) => api.get('/posts/', { params: p }),
  feed: (p) => api.get('/posts/feed', { params: p }),
  create: (d) => api.post('/posts/', d),
  getById: (id) => api.get(`/posts/${id}`),
  update: (id, d) => api.put(`/posts/${id}`, d),
  delete: (id) => api.delete(`/posts/${id}`),
  toggleLike: (id) => api.post(`/posts/${id}/like`),
  getComments: (id, p) => api.get(`/posts/${id}/comments`, { params: p }),
  createComment: (id, d) => api.post(`/posts/${id}/comments`, d),
}

export const storiesAPI = {
  list: (p) => api.get('/stories', { params: p }),
  getMyStories: () => api.get('/stories/me'),
  getUserStories: (userId) => api.get(`/stories/user/${userId}`),
  getById: (id) => api.get(`/stories/${id}`),
  create: (formData) => api.post('/stories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/stories/${id}`),
  getComments: (id) => api.get(`/stories/${id}/comments`),
  addComment: (id, d) => api.post(`/stories/${id}/comments`, d),
}

export const commentsAPI = {
  update: (id, d) => api.put(`/comments/${id}`, d),
  delete: (id) => api.delete(`/comments/${id}`),
  getReplies: (id) => api.get(`/comments/${id}/replies`),
}

export const notificationsAPI = {
  list: (p) => api.get('/notifications/', { params: p }),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
}

export const messagesAPI = {
  inbox: () => api.get('/messages/inbox'),
  getConversation: (userId, p) => api.get(`/messages/${userId}`, { params: p }),
  send: (userId, d) => api.post(`/messages/${userId}`, d),
  sendImage: (userId, formData) => api.post(`/messages/${userId}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (msgId) => api.delete(`/messages/${msgId}`),
}

export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  listUsers: (p) => api.get('/admin/users', { params: p }),
  updateUser: (id, d) => api.put(`/admin/users/${id}`, d),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  listPosts: (p) => api.get('/admin/posts', { params: p }),
  deletePost: (id) => api.delete(`/admin/posts/${id}`),
  pinPost: (id) => api.post(`/admin/posts/${id}/pin`),
}

export const mediaURL = (path) => {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '')
  return `${base}${path}`
}

export default api
