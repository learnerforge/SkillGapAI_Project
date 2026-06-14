import { type InputHTMLAttributes, useId } from 'react'

interface URadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export default function URadio({ label, className = '', id, ...props }: URadioProps) {
  const uid = id || `rb-${useId()}`
  return (
    <label htmlFor={uid} className="inline-flex items-center gap-3 cursor-pointer select-none group">
      <input type="radio" id={uid} className="sr-only peer" {...props} />
      <span
        className={`
          w-5 h-5 rounded-full border-2 border-white/30
          flex items-center justify-center shrink-0
          transition-all duration-200
          peer-checked:border-[#e94560] peer-checked:shadow-[0_0_10px_rgba(233,69,96,0.4)]
          group-hover:border-white/50
          peer-focus-visible:ring-2 peer-focus-visible:ring-[#e94560]/40
          ${className}
        `}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#e94560] scale-0 peer-checked:scale-100 transition-transform duration-200" />
      </span>
      {label && <span className="text-white/80 text-sm group-hover:text-white transition-colors">{label}</span>}
    </label>
  )
}
