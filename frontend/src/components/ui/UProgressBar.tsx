interface UProgressBarProps {
  value: number
  max?: number
  variant?: 'accent' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  labelPosition?: 'top' | 'right' | 'bottom'
  className?: string
}

const gradientMap: Record<string, string> = {
  accent: 'from-[#e94560] to-[#14ffec]',
  success: 'from-[#14ffec] to-[#0d7377]',
  warning: 'from-[#f39c12] to-[#e67e22]',
  danger: 'from-[#e74c3c] to-[#c0392b]',
}

const sizeMap: Record<string, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export default function UProgressBar({
  value,
  max = 100,
  variant = 'accent',
  showLabel = false,
  size = 'md',
  animated = false,
  labelPosition = 'top',
  className = '',
}: UProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`w-full ${className}`}>
      {showLabel && labelPosition === 'top' && (
        <div className="flex items-center justify-between mb-1">
          {labelPosition === 'top' && <span />}
          <span className="text-xs font-semibold text-[#14ffec]">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`w-full ${sizeMap[size]} bg-white/10 rounded-full overflow-hidden`}>
        <div
          className={`
            h-full rounded-full bg-gradient-to-r ${gradientMap[variant]}
            transition-all duration-700 ease-out
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${pct}%` }}
        >
          {animated && (
            <div className="h-full w-full bg-white/10 rounded-full" style={{ animation: 'shimmer 2s infinite' }} />
          )}
        </div>
      </div>
      {showLabel && labelPosition === 'bottom' && (
        <div className="text-right mt-1">
          <span className="text-xs font-semibold text-[#14ffec]">{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  )
}
