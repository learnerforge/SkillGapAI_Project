import { type ReactNode, useState } from 'react'

interface UAccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: 'chevron' | 'plus'
  className?: string
}

export default function UAccordion({ title, children, defaultOpen = false, icon = 'chevron', className = '' }: UAccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={`
        border border-white/10 rounded-xl overflow-hidden
        transition-all duration-200
        ${open ? 'border-[#e94560]/30' : 'hover:border-white/20'}
        ${className}
      `}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left text-white font-semibold hover:bg-white/[0.03] transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm">{title}</span>
        {icon === 'chevron' ? (
          <svg
            className={`w-4 h-4 text-white/50 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 12 8" fill="none"
          >
            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <span className={`relative w-4 h-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
            <span className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 rounded-full bg-white/50" />
            <span className="absolute top-0 left-1/2 w-0.5 h-full -translate-x-1/2 rounded-full bg-white/50 transition-transform duration-300" />
          </span>
        )}
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 py-3 border-t border-white/10 text-white/70 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}
