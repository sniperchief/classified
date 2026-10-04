/**
 * Live mission checklist. Each item is ticked by real state passed in from the screen
 * (wallet created, funds detected, transaction confirmed…) — never by a timer.
 * The first unfinished item is highlighted as the current objective.
 */
export function Objectives({ items }: { items: { label: string; done: boolean }[] }) {
  const current = items.findIndex((i) => !i.done);
  const doneCount = items.filter((i) => i.done).length;
  return (
    <div className="animate-fade-up rounded-[14px] border border-ash bg-black p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="label text-[10px] text-muted">Objectives</span>
        <span className="label text-[10px] text-dim">
          {doneCount}/{items.length}
        </span>
      </div>
      <ol className="mt-3 space-y-2.5">
        {items.map((it, i) => {
          const active = i === current;
          return (
            <li key={it.label} className="flex items-center gap-3">
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-[5px] font-mono text-[11px] font-bold transition-colors duration-300 ${
                  it.done ? "bg-white text-black" : active ? "ring-in-pink text-pink" : "ring-in-ash text-transparent"
                }`}
              >
                {it.done ? "✓" : active ? "▸" : ""}
              </span>
              <span
                className={`font-mono text-[12px] font-semibold uppercase tracking-[0.06em] sm:text-[13px] ${
                  it.done ? "text-muted line-through decoration-ash" : active ? "text-white" : "text-dim"
                }`}
              >
                {it.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
