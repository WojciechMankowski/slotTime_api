import axios from 'axios'
import { getLang, t } from '../Helper/i18n'
import { toastBus } from '../Helper/toastBus'

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const warehouseId = localStorage.getItem('warehouse_id')
  if (warehouseId) {
    config.params = { warehouse_id: Number(warehouseId), ...config.params }
  }

  return config
})

let _isRefreshing = false
let _refreshQueue: Array<(token: string) => void> = []

function _processQueue(newToken: string) {
  _refreshQueue.forEach((resolve) => resolve(newToken))
  _refreshQueue = []
}

function _logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('warehouse_id')
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const lang = getLang()
    const status: number | undefined = error.response?.status
    const originalRequest = error.config

    if (status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken || originalRequest.url?.includes('/api/refresh')) {
        _logout()
        return Promise.reject(error)
      }

      if (_isRefreshing) {
        return new Promise((resolve) => {
          _refreshQueue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      _isRefreshing = true

      try {
        const res = await axios.post('http://127.0.0.1:8000/api/refresh', { refresh_token: refreshToken })
        const newToken: string = res.data.access_token
        localStorage.setItem('token', newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        _processQueue(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        _logout()
        return Promise.reject(error)
      } finally {
        _isRefreshing = false
      }
    }

    if (status === 403) {
      toastBus.emit('error', t('error_forbidden', lang))
    } else if (status !== undefined && status >= 500) {
      toastBus.emit('error', t('error_server', lang))
    } else if (!error.response && error.request) {
      toastBus.emit('error', t('error_offline', lang))
    }

    return Promise.reject(error)
  }
)

export function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

export function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem('refresh_token', token)
  else localStorage.removeItem('refresh_token')
}

export function setWarehouseId(id: number | null) {
  if (id !== null) localStorage.setItem('warehouse_id', String(id))
  else localStorage.removeItem('warehouse_id')
}

export function getWarehouseId(): number | null {
  const v = localStorage.getItem('warehouse_id')
  return v ? Number(v) : null
}