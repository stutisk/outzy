import { cn } from "@/lib/cn";

type FilterChipProps = {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export function FilterChip({
  active = false,
  children,
  onClick,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-ink bg-ink text-surface"
          : "border-ink/14 bg-surface text-muted hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}
