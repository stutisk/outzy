export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="size-8 animate-spin rounded-full border-2 border-ink/15 border-t-accent"
        aria-hidden
      />
      {label ? <p className="text-sm text-muted">{label}</p> : null}
    </div>
  );
}
