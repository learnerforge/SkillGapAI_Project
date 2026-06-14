import { type InputHTMLAttributes, useId } from 'react'

interface UCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  indeterminate?: boolean
}

export default function UCheckbox({ label, indeterminate, className = '', id, ...props }: UCheckboxProps) {
  const uid = id || `cb-${useId()}`
  return (
    <label htmlFor={uid} className="inline-flex items-center gap-3 cursor-pointer select-none group">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          id={uid}
          className="sr-only peer"
          ref={el => { if (el) el.indeterminate = indeterminate ?? false }}
          {...props}
        />
        <div
          className={`
            w-5 h-5 border-2 border-[#14ffec] rounded
            bg-transparent flex items-center justify-center shrink-0
            transition-all duration-200
            peer-checked:bg-[#14ffec] peer-checked:shadow-[0_0_10px_rgba(20,255,236,0.4)]
            group-hover:border-[#14ffec]/70
            peer-focus-visible:ring-2 peer-focus-visible:ring-[#14ffec]/40
            ${className}
          `}
        >
          {indeterminate ? (
            <span className="w-2.5 h-0.5 bg-[#0a0a0b] rounded-full" />
          ) : (
            <svg
              className="opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
              width="12" height="12" viewBox="0 0 12 12" fill="none"
            >
              <path d="M2 6L5 9L10 3" stroke="#0a0a0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      {label && <span className="text-white/80 text-sm group-hover:text-white transition-colors">{label}</span>}
    </label>
  )
}
