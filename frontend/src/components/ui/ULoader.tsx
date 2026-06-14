interface ULoaderProps {
  variant?: 'bars' | 'spinner' | 'typewriter' | 'dots'
  text?: string
  size?: 'sm' | 'md' | 'lg'
  overlay?: boolean
}

const sizeMap = { sm: 'h-1', md: 'h-2', lg: 'h-3' }
const dotSizes = { sm: 'w-1.5 h-1.5', md: 'w-2.5 h-2.5', lg: 'w-3.5 h-3.5' }

export default function ULoader({ variant = 'spinner', text, size = 'md', overlay = false }: ULoaderProps) {
  const content = (
    <>
      {variant === 'bars' && (
        <div className="flex items-center gap-1" role="status" aria-label="Loading">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`w-2 ${sizeMap[size]} rounded bg-[#e94560] animate-pulse`}
              style={{
                animation: `barPulse 0.9s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {variant === 'dots' && (
        <div className="flex items-center gap-1.5" role="status" aria-label="Loading">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`${dotSizes[size]} rounded-full bg-[#e94560]`}
              style={{
                animation: `fadeIn 0.6s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}

      {variant === 'typewriter' && (
        <div
          className="inline-flex overflow-hidden border-r-2 border-white/75 animate-blink whitespace-nowrap"
          role="status"
          aria-label="Loading"
        >
          <span
            className="text-2xl font-bold bg-gradient-to-r from-[#e94560] to-[#14ffec] bg-clip-text text-transparent"
            style={{ animation: 'typewriter 2s steps(10) infinite alternate' }}
          >
            {text || 'Loading...'}
          </span>
        </div>
      )}

      {variant === 'spinner' && (
        <div className="flex items-center justify-center gap-3" role="status" aria-label="Loading">
          <div
            className={`border-2 border-white/10 border-t-[#e94560] rounded-full animate-spin ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'}`}
          />
          {text && <span className="text-[#888] text-sm">{text}</span>}
        </div>
      )}
    </>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0b]/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {content}
          {text && <span className="text-white/60 text-sm">{text}</span>}
        </div>
      </div>
    )
  }

  return content
}
