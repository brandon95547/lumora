// A section of the side panel, folded into one accordion: opening one closes the others (the
// <details> share a name). Its header shows `summary`, a line of what is set inside, so a closed
// section still says what it holds.
import { Icon } from './Icon.jsx';

const GROUP = 'lumora-options';

export function Panel({ title, summary, open = false, children }) {
  return (
    <details
      name={GROUP}
      open={open}
      className="group rounded-(--radius-card) border border-line bg-surface/60 open:bg-surface/80"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-(--radius-card) p-4 select-none focus-visible:outline-2 focus-visible:outline-accent sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-base font-semibold">{title}</h2>
          {summary && <span className="truncate text-caption text-faint">{summary}</span>}
        </span>
        <Icon
          name="chevron"
          className="size-5 shrink-0 text-muted motion-safe:transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-5 px-4 pb-5 sm:px-5">{children}</div>
    </details>
  );
}
