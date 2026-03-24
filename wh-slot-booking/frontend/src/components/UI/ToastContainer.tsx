import React, { useEffect, useState } from 'react'
import { toastBus, ToastType } from '../../Helper/toastBus'

interface Toast {
  id: number
  type: ToastType
  message: string
}

let nextId = 1

const colorMap: Record<ToastType, string> = {
  error: 'bg-red-600',
  success: 'bg-green-600',
  warning: 'bg-amber-500',
  info: 'bg-blue-600',
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    return toastBus.on((type, message) => {
      const id = nextId++
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg text-sm text-white ${colorMap[toast.type]}`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="opacity-70 hover:opacity-100 shrink-0"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
