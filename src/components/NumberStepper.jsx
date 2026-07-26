export default function NumberStepper({ value, onChange, min = 1, error }) {
  function step(delta) {
    const current = Number(value) || 0
    const next = Math.max(min, current + delta)
    onChange(next)
  }

  return (
    <div>
      <div className="flex items-center border border-slate-300 rounded-md overflow-hidden w-max">
        <button
          type="button"
          onClick={() => step(-1)}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
        >
          −
        </button>
        <input
          type="number"
          className="w-16 text-center py-2 focus:outline-none"
          value={value ?? ''}
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
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
        >
          +
        </button>
      </div>
      {error && <p className="text-xs text-brand-red mt-1">{error}</p>}
    </div>
  )
}
