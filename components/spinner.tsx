export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="size-8 animate-spin rounded-full border-2 border-stone-200 border-t-coral"
        aria-hidden
      />
      {label ? <p className="text-sm text-stone-500">{label}</p> : null}
    </div>
  );
}
