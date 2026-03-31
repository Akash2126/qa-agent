import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qa_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('qa_token')
      localStorage.removeItem('qa_user')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export const qaService = {
  generate:  (payload)    => api.post('/generate', payload),
  history:   (skip = 0)   => api.get(`/history?skip=${skip}&limit=30`),
  getrun:    (id)         => api.get(`/history/${id}`),
  deleterun: (id)         => api.delete(`/history/${id}`),
  save:      (id, title)  => api.post(`/save/${id}`, { title }),
  usage:     ()           => api.get('/usage'),
  settings:  ()           => api.get('/settings'),
  updateSettings: (body)  => api.patch('/settings', body),
}

export const githubService = {
  listFiles: (repoUrl)            => api.get(`/github/files?repo_url=${encodeURIComponent(repoUrl)}`),
  getFile:   (owner, repo, path)  => api.get(`/github/file?owner=${owner}&repo=${repo}&path=${encodeURIComponent(path)}`),
}
