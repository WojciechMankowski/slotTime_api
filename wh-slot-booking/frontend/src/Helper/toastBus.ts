export type ToastType = 'success' | 'error' | 'warning' | 'info'

type Listener = (type: ToastType, message: string) => void

const listeners: Listener[] = []

export const toastBus = {
  emit(type: ToastType, message: string) {
    listeners.forEach((fn) => fn(type, message))
  },
  on(fn: Listener): () => void {
    listeners.push(fn)
    return () => {
      const i = listeners.indexOf(fn)
      if (i !== -1) listeners.splice(i, 1)
    }
  },
}
