import { Icon } from './Icon.jsx';

const VARIANTS = {
  primary: 'bg-accent text-on-accent hover:bg-accent-strong disabled:opacity-50',
  quiet: 'bg-raised text-ink hover:bg-hover border border-line disabled:opacity-50',
};

const SIZES = {
  md: { text: 'h-10 px-4', icon: 'size-10', glyph: 'size-4' },
  lg: { text: 'h-12 px-6 text-base', icon: 'size-12', glyph: 'size-5' },
};

/** One button for the whole app; `hideLabel` makes it an icon button that keeps its label for screen readers. */
export function Button({ label, icon, variant = 'quiet', size = 'md', hideLabel = false, spinning = false, ...rest }) {
  const s = SIZES[size];
  return (
    <button
      type="button"
      aria-label={hideLabel ? label : undefined}
      title={hideLabel ? label : undefined}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed ${hideLabel ? s.icon : s.text} ${VARIANTS[variant]}`}
      {...rest}
    >
      {spinning ? (
        <Icon name="loader" className={`${s.glyph} animate-spin-slow`} />
      ) : (
        icon && <Icon name={icon} className={s.glyph} />
      )}
      {!hideLabel && label}
    </button>
  );
}
