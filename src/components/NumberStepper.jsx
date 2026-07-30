export default function NumberStepper({ value, onChange, min = 1, error, disabled = false }) {
  function step(delta) {
    if (disabled) return
    const current = Number(value) || 0
    const next = Math.max(min, current + delta)
    onChange(next)
  }

  return (
    <div>
      <div
        className={`flex items-center border rounded-md overflow-hidden w-max ${
          disabled ? 'border-slate-200 bg-slate-50' : 'border-slate-300'
        }`}
      >
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={disabled}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
        >
          −
        </button>
        <input
          type="number"
          className="w-16 text-center py-2 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value
            if (v === '') {
              onChange(min)
              return
            }
            const num = Number(v)
            onChange(Number.isNaN(num) ? min : Math.max(min, num))
          }}
        />
        <button
          type="button"
          onClick={() => step(1)}
          disabled={disabled}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
        >
          +
        </button>
      </div>
      {error && <p className="text-xs text-brand-red mt-1">{error}</p>}
    </div>
  )
}
