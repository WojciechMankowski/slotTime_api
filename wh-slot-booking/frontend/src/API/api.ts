import axios from 'axios'

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