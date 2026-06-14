import { createContext, useContext, useState, useCallback, type ReactNode, useRef } from 'react'
import { UNotification } from '../components/ui'

type NotificationVariant = 'success' | 'error' | 'info' | 'warning'

interface Notification {
  id: number
  variant: NotificationVariant
  title?: string
  message: string
  duration: number
}

interface NotificationContextType {
  notify: (message: string, variant?: NotificationVariant, title?: string, duration?: number) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, variant: NotificationVariant = 'info', title?: string, duration = 4000) => {
      const id = ++idRef.current
      setNotifications(prev => [...prev, { id, variant, title, message, duration }])
      if (duration > 0) {
        setTimeout(() => remove(id), duration + 300)
      }
    },
    [remove],
  )

  const success = useCallback((message: string, title?: string) => notify(message, 'success', title), [notify])
  const error = useCallback((message: string, title?: string) => notify(message, 'error', title), [notify])
  const info = useCallback((message: string, title?: string) => notify(message, 'info', title), [notify])
  const warning = useCallback((message: string, title?: string) => notify(message, 'warning', title), [notify])

  return (
    <NotificationContext.Provider value={{ notify, success, error, info, warning }}>
      {children}
      {notifications.map(n => (
        <UNotification
          key={n.id}
          show={true}
          variant={n.variant}
          title={n.title}
          message={n.message}
          duration={n.duration}
          onClose={() => remove(n.id)}
        />
      ))}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider')
  return ctx
}
