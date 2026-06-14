import { type InputHTMLAttributes, type ReactNode, forwardRef, useState } from 'react'

interface UInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  clearable?: boolean
  showPasswordToggle?: boolean
  maxLength?: number
}

const UInput = forwardRef<HTMLInputElement, UInputProps>(
  ({ label, error, helperText, icon, clearable, showPasswordToggle, maxLength, className = '', value, onChange, type, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const [passwordVisible, setPasswordVisible] = useState(false)
    const isPassword = type === 'password' && showPasswordToggle
    const inputType = isPassword ? (passwordVisible ? 'text' : 'password') : type
    const strLen = typeof value === 'string' ? value.length : 0

    const handleClear = () => {
      const nativeEvent = new Event('input', { bubbles: true })
      const input = document.createElement('input')
      Object.defineProperty(nativeEvent, 'target', { value: input })
      const synthetic = { ...nativeEvent, target: { ...input, value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>
      onChange?.(synthetic)
    }

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
            relative flex items-center bg-[#141416] border rounded-lg
            transition-all duration-200
            ${focused ? 'border-[#e94560]/60 ring-2 ring-[#e94560]/20' : 'border-white/10'}
            ${error ? 'border-[#e74c3c] ring-2 ring-[#e74c3c]/20' : ''}
          `}
        >
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            value={value}
            onChange={onChange}
            onFocus={e => { setFocused(true); props.onFocus?.(e) }}
            onBlur={e => { setFocused(false); props.onBlur?.(e) }}
            maxLength={maxLength}
            className={`
              w-full bg-transparent text-white text-base py-3
              ${icon ? 'pl-10' : 'pl-4'}
              ${clearable && strLen > 0 ? 'pr-10' : ''}
              ${isPassword ? 'pr-10' : ''}
              ${!clearable && !isPassword ? 'pr-4' : ''}
              placeholder:text-[#666]
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
          {clearable && strLen > 0 && !isPassword && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
              tabIndex={-1}
              aria-label="Clear input"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => setPasswordVisible(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
              tabIndex={-1}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            >
              {passwordVisible ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>
        {(error || helperText) && (
          <p className={`mt-1 text-sm ${error ? 'text-[#e74c3c]' : 'text-[#666]'}`}>
            {error || helperText}
          </p>
        )}
        {maxLength && !error && (
          <p className={`mt-1 text-xs text-right ${strLen >= maxLength ? 'text-[#e94560]' : 'text-[#555]'}`}>
            {strLen}/{maxLength}
          </p>
        )}
      </div>
    )
  },
)

UInput.displayName = 'UInput'
export default UInput
