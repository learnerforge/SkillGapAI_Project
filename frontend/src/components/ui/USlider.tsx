import { type InputHTMLAttributes, useState } from 'react'

interface USliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string
  value: number
  onChange: (value: number) => void
  showValue?: boolean
  min?: number
  max?: number
  step?: number
  marks?: boolean
}

export default function USlider({
  label,
  value,
  onChange,
  showValue = true,
  min = 0,
  max = 100,
  step = 1,
  marks = false,
  className = '',
}: USliderProps) {
  const [hover, setHover] = useState(false)
  const pct = ((value - min) / (max - min)) * 100

  const stepMarks = marks
    ? Array.from({ length: 5 }, (_, i) => {
        const val = min + (i * (max - min)) / 4
        return { val, label: String(val) }
      })
    : []

  return (
    <div
      className={`${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-white/90">{label}</label>
          {showValue && (
            <span
              className={`text-sm font-semibold transition-colors duration-200 ${hover ? 'text-[#e94560]' : 'text-[#14ffec]'}`}
            >
              {value}
            </span>
          )}
        </div>
      )}
      <div className="relative py-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:bg-[#e94560] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(233,69,96,0.6)]
            [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:duration-200
            [&::-webkit-slider-thumb]:hover:shadow-[0_0_16px_rgba(233,69,96,0.8)]
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:bg-[#e94560] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-[0_0_12px_rgba(233,69,96,0.6)]"
          style={{
            background: `linear-gradient(to right, #e94560 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
          }}
        />
        {marks && stepMarks.map(m => (
          <div
            key={m.val}
            className="absolute top-4 text-[10px] text-white/30"
            style={{ left: `${((m.val - min) / (max - min)) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {m.label}
          </div>
        ))}
      </div>
    </div>
  )
}
