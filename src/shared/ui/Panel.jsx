/** A titled section of the side panel. */
export function Panel({ title, children }) {
  return (
    <section className="rounded-(--radius-card) border border-line bg-surface/60 p-4 sm:p-5">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
