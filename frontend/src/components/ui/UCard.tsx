import type { ReactNode, HTMLAttributes } from 'react'

interface UCardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean
  hover?: boolean
  padded?: boolean | 'sm' | 'md' | 'lg'
  glass?: boolean
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

const paddingMap: Record<string, string> = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

export default function UCard({
  accent = false,
  hover = false,
  padded = 'md' as 'sm' | 'md' | 'lg',
  glass = false,
  header,
  footer,
  children,
  className = '',
  ...props
}: UCardProps) {
  const padClass = padded === true ? 'p-5' : padded === false ? '' : paddingMap[padded] || 'p-5'

  return (
    <div
      className={`
        ${glass ? 'bg-white/5 backdrop-blur-xl' : 'bg-[#0f0f10]'}
        border ${accent ? 'border-[#bb6c74]' : 'border-white/10'}
        rounded-2xl
        ${hover ? 'transition-all duration-300 hover:border-[#e94560]/50 hover:shadow-lg hover:shadow-[#e94560]/5 hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className={`${padClass} border-b border-white/10`}>
          {header}
        </div>
      )}
      {header ? (
        <div className={padClass}>{children}</div>
      ) : (
        children && <div className={padClass}>{children}</div>
      )}
      {footer && (
        <div className={`${padClass} border-t border-white/10`}>
          {footer}
        </div>
      )}
    </div>
  )
}
