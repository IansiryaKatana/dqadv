import { toColorInputValue } from '#/lib/site/branding'

type AdminColorFieldProps = {
  label: string
  value: string
  fallback: string
  onChange: (value: string) => void
}

export function AdminColorField({ label, value, fallback, onChange }: AdminColorFieldProps) {
  const pickerValue = toColorInputValue(value, fallback)

  return (
    <label className="block space-y-2">
      <span className="admin-label">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="color"
          className="h-10 w-14 shrink-0 cursor-pointer rounded border border-[#e5e5e5] bg-white p-1"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
        />
        <input
          className="admin-input flex-1 font-mono uppercase"
          value={value}
          placeholder={fallback}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </label>
  )
}
