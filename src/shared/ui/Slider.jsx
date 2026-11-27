/** One slider for every number the app lets you set by feel; `format` shows its value. */
export function Slider({ label, value, min, max, step = 1, onChange, format = String }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex justify-between text-sm">
        <span className="font-medium text-muted">{label}</span>
        <span className="tabular-nums text-faint">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 w-full cursor-pointer accent-accent"
      />
    </label>
  );
}
