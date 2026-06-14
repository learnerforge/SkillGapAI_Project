import { type SelectHTMLAttributes, useState } from 'react'

interface USelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
}

export default function USelect({ label, options, placeholder, error, className = '', value, ...props }: USelectProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white/80 mb-2">
          {label}
          {props.required && <span className="text-[#e94560] ml-1">*</span>}
        </label>
      )}
      <div
        className={`
          relative bg-[#141416] border rounded-lg
          transition-all duration-200
          ${focused ? 'border-[#e94560]/60 ring-2 ring-[#e94560]/20' : 'border-white/10'}
          ${error ? 'border-[#e74c3c]' : ''}
        `}
      >
        <select
          value={value}
          onFocus={e => { setFocused(true); props.onFocus?.(e) }}
          onBlur={e => { setFocused(false); props.onBlur?.(e) }}
          className={`
            w-full appearance-none bg-transparent text-white text-base
            px-4 py-3 pr-10 rounded-lg
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${value === '' || value === undefined ? 'text-[#666]' : 'text-white'}
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="" className="bg-[#0a0a0b]">{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value} className="bg-[#0a0a0b] text-white">{o.label}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 transition-transform duration-200">
          <svg
            width="12" height="8" viewBox="0 0 12 8" fill="none"
            className={focused ? 'rotate-180' : ''}
          >
            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {error && <p className="text-[#e74c3c] text-sm mt-1">{error}</p>}
    </div>
  )
}
