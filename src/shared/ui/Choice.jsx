// One radio-group control for every "pick one" in the app. `variant` sets its look:
// 'segmented' for a compact row of words, 'cards' for a grid of larger tiles.
import { useId } from 'react';

const LOOKS = {
  segmented: {
    group: 'inline-flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1',
    option:
      'cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-ink has-checked:bg-raised has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-accent',
  },
  cards: {
    group: 'grid grid-cols-2 gap-2',
    option:
      'cursor-pointer overflow-hidden rounded-xl border border-line bg-surface text-left transition-colors hover:border-line-strong has-checked:border-accent has-checked:ring-1 has-checked:ring-accent has-focus-visible:outline-2 has-focus-visible:outline-accent',
  },
};

export function Choice({ label, options, value, onChange, variant = 'segmented', render }) {
  const name = useId();
  const look = LOOKS[variant];
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-muted">{label}</legend>
      <div className={look.group}>
        {options.map((option) => (
          <label key={option.id} className={look.option}>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            {render ? render(option, value === option.id) : option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
