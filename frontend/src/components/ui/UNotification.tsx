import { type ReactNode, useEffect, useState, useCallback } from 'react'

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

interface UNotificationProps {
  show: boolean
  variant?: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
  icon?: ReactNode
  duration?: number
  position?: Position
  onClose?: () => void
}

const variantStyles: Record<string, string> = {
  success: 'border-[#14ffec]/30 bg-[#14ffec]/10 text-[#14ffec]',
  error: 'border-[#e74c3c]/30 bg-[#e74c3c]/10 text-[#e74c3c]',
  info: 'border-[#e94560]/30 bg-[#e94560]/10 text-[#e94560]',
  warning: 'border-[#f39c12]/30 bg-[#f39c12]/10 text-[#f39c12]',
}

const variantIcons: Record<string, string> = {
  success: 'M22 11.08V12a10 10 0 1 1-5.93-9.14',
  error: 'M18 6L6 18M6 6l12 12',
  info: 'M12 16v-4M12 8h.01',
  warning: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
}

const positionMap: Record<Position, string> = {
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
}

export default function UNotification({
  show,
  variant = 'info',
  title,
  message,
  icon,
  duration = 4000,
  position = 'top-right',
  onClose,
}: UNotificationProps) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const dismiss = useCallback(() => {
    setLeaving(true)
    setTimeout(() => { setVisible(false); setLeaving(false); onClose?.() }, 200)
  }, [onClose])

  useEffect(() => {
    if (show) {
      setVisible(true)
      setLeaving(false)
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(), duration)
        return () => clearTimeout(timer)
      }
    } else {
      setVisible(false)
    }
  }, [show, duration, dismiss])

  if (!visible) return null

  return (
    <div
      className={`
        fixed z-50 max-w-sm
        border rounded-xl p-4 shadow-2xl backdrop-blur-xl
        ${positionMap[position]}
        ${leaving ? 'animate-fadeOut' : 'animate-slideIn'}
        ${variantStyles[variant]}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {icon || (
          <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={variantIcons[variant] || variantIcons.info} />
            {variant === 'success' && <polyline points="20 6 9 17 4 12" />}
            {variant === 'info' && [<circle key="c" cx="12" cy="12" r="10" />]}
          </svg>
        )}
        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
