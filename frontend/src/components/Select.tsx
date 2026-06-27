import { useState, useRef, useEffect, useCallback } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
}

export default function Select({ options, value, onChange, placeholder, disabled, loading }: Props) {
  const [open, setOpen] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)

  const close = useCallback(() => {
    setOpen(false)
    setFocusedIdx(-1)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          close()
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIdx(prev => (prev < options.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIdx(prev => (prev > 0 ? prev - 1 : options.length - 1))
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (focusedIdx >= 0 && focusedIdx < options.length) {
            onChange(options[focusedIdx].value)
            close()
          }
          break
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, options, focusedIdx, onChange, close])

  useEffect(() => {
    if (open && focusedIdx >= 0 && listRef.current) {
      const item = listRef.current.children[focusedIdx] as HTMLElement | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [open, focusedIdx])

  return (
    <div className="custom-select" ref={rootRef}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => !disabled && setOpen(prev => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {loading ? (
          <span className="custom-select-placeholder">Loading...</span>
        ) : selected ? (
          <span className="custom-select-value">{selected.label}</span>
        ) : (
          <span className="custom-select-placeholder">{placeholder || 'Select...'}</span>
        )}
        <span className={`custom-select-arrow ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="custom-select-dropdown" ref={listRef} role="listbox">
          {options.length === 0 ? (
            <div className="custom-select-empty">No options</div>
          ) : (
            options.map((opt, i) => (
              <div
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className={`custom-select-option ${opt.value === value ? 'selected' : ''} ${focusedIdx === i ? 'focused' : ''}`}
                onClick={() => {
                  onChange(opt.value)
                  close()
                }}
                onMouseEnter={() => setFocusedIdx(i)}
              >
                <span>{opt.label}</span>
                {opt.value === value && <span className="custom-select-check">&#10003;</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
