import { type InputHTMLAttributes, useId } from 'react'

interface UToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  size?: 'sm' | 'md'
}

const trackSizes = { sm: 'w-8 h-4', md: 'w-11 h-6' }
const thumbSizes = { sm: 'w-3 h-3', md: 'w-5 h-5' }
const translateSizes = { sm: 'peer-checked:translate-x-4', md: 'peer-checked:translate-x-5' }

export default function UToggle({ label, size = 'md', className = '', id, ...props }: UToggleProps) {
  const uid = id || `tg-${useId()}`
  return (
    <label htmlFor={uid} className="inline-flex items-center gap-3 cursor-pointer select-none">
      <div
        className={`
          relative ${trackSizes[size]} rounded-full
          bg-[#444] transition-colors duration-200
          has-[:checked]:bg-[#e94560]
          has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#e94560]/40
          ${className}
        `}
      >
        <input type="checkbox" id={uid} className="sr-only peer" {...props} />
        <span
          className={`
            absolute left-0.5 top-0.5 ${thumbSizes[size]} rounded-full
            bg-white shadow-md
            transition-transform duration-200
            ${translateSizes[size]}
          `}
        />
      </div>
      {label && <span className="text-white/80 text-sm">{label}</span>}
    </label>
  )
}
