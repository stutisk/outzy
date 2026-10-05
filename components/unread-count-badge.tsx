export function UnreadCountBadge({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={`inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[10px] font-bold leading-none text-white tabular-nums ${className}`}
      aria-label={`${count} unread messages`}
    >
      {label}
    </span>
  );
}
