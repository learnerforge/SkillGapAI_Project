interface USkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string
  height?: string
  count?: number
  className?: string
}

export default function USkeleton({ variant = 'text', width, height, count = 1, className = '' }: USkeletonProps) {
  const base = 'bg-white/5 rounded animate-pulse'

  if (variant === 'circular') {
    return (
      <div
        className={`${base} rounded-full ${className}`}
        style={{ width: width || '40px', height: height || '40px' }}
      />
    )
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={`${base} rounded-lg ${className}`}
        style={{ width: width || '100%', height: height || '120px' }}
      />
    )
  }

  if (variant === 'card') {
    return (
      <div className={`${base} rounded-2xl p-5 space-y-4 ${className}`}>
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-5/6" />
          <div className="h-3 bg-white/10 rounded w-2/3" />
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${base} h-3 rounded`}
          style={{
            width: width || `${70 + Math.random() * 30}%`,
            height: height || '12px',
          }}
        />
      ))}
    </div>
  )
}
