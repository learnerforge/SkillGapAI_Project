import type { ReactNode } from 'react'

interface UBadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  dot?: boolean
  max?: number
  children: ReactNode
  className?: string
}

const badgeVariants: Record<string, string> = {
  default: 'bg-white/10 text-white/80',
  success: 'bg-[#14ffec]/20 text-[#14ffec]',
  warning: 'bg-[#f39c12]/20 text-[#f39c12]',
  danger: 'bg-[#e74c3c]/20 text-[#e74c3c]',
  info: 'bg-white/[0.06] text-white/70',
}

const dotVariants: Record<string, string> = {
  default: 'bg-white/40',
  success: 'bg-[#14ffec]',
  warning: 'bg-[#f39c12]',
  danger: 'bg-[#e74c3c]',
  info: 'bg-[#e94560]',
}

const sizeStyles: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
}

export default function UBadge({ variant = 'default', size = 'md', dot = false, max, children, className = '' }: UBadgeProps) {
  const count = typeof children === 'number' ? children : undefined
  const display = max && count !== undefined && count > max ? `${max}+` : children

  const baseClass = `inline-flex items-center font-semibold rounded-full ${badgeVariants[variant]} ${sizeStyles[size]} ${className}`

  if (dot) {
    return (
      <span className={`${baseClass} gap-1.5`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotVariants[variant]}`} />
        {display}
      </span>
    )
  }

  return (
    <span className={baseClass}>
      {display}
    </span>
  )
}
