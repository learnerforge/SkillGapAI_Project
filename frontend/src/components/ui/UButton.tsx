import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

interface UButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'cta'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  icon?: ReactNode
  tooltip?: string
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-[#0a0a0b] text-[#e94560] border border-[#e94560]/30 hover:text-[#0a0a0b] hover:bg-[#e94560] hover:border-[#e94560] shadow-lg shadow-black/20',
  secondary:
    'bg-transparent text-white border border-white/20 hover:bg-white/[0.06]',
  ghost:
    'bg-transparent text-[#888] border border-white/10 hover:bg-white/5 hover:text-white',
  danger:
    'bg-[#e74c3c] text-white hover:bg-[#c0392b]',
  cta:
    'bg-[#e94560] text-white border border-[#e94560] hover:bg-[#d63851] active:bg-[#c22e46] shadow-lg shadow-[#e94560]/20',
}

const sizeStyles: Record<string, string> = {
  sm: 'px-4 py-2 text-sm gap-1.5',
  md: 'px-6 py-3 text-base gap-2',
  lg: 'px-8 py-4 text-lg gap-2.5',
}

const UButton = forwardRef<HTMLButtonElement, UButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, fullWidth = false, icon, tooltip, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        title={tooltip}
        className={`
          relative inline-flex items-center justify-center font-bold rounded-full
          transition-all duration-200 overflow-hidden select-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e94560]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          active:scale-[0.97]
          ${fullWidth ? 'w-full' : ''}
          ${variantStyles[variant]} ${sizeStyles[size]}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children && <span>{children}</span>}
          </span>
        ) : (
          <>
            {icon && <span className="inline-flex shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </button>
    )
  },
)

UButton.displayName = 'UButton'
export default UButton
