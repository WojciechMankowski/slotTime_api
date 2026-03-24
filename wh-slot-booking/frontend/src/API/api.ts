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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const lang = getLang()
    const status: number | undefined = error.response?.status

    if (status === 401) {
      localStorage.removeItem('token')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
      return Promise.reject(error)
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

export function setWarehouseId(id: number | null) {
  if (id !== null) localStorage.setItem('warehouse_id', String(id))
  else localStorage.removeItem('warehouse_id')
}

export function getWarehouseId(): number | null {
  const v = localStorage.getItem('warehouse_id')
  return v ? Number(v) : null
}