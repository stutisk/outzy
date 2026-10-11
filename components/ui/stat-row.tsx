import type { LandingStat } from "@/lib/landing-plans";
import { cn } from "@/lib/cn";

type StatRowProps = {
  stats: LandingStat[];
  className?: string;
};

export function StatRow({ stats, className }: StatRowProps) {
  if (stats.length === 0) {
    return null;
  }

  const cols = stats.length;

  return (
    <div
      className={cn(
        "grid border-hairline-y",
        cols === 1 && "grid-cols-1",
        cols === 2 && "sm:grid-cols-2",
        cols >= 3 && "sm:grid-cols-3",
        className,
      )}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            "flex flex-col gap-2 px-6 py-10 sm:px-10",
            i > 0 && "border-hairline-t sm:border-t-0 sm:border-l",
          )}
        >
          <span className="text-4xl font-medium tracking-tight text-ink tabular-nums md:text-5xl">
            {stat.value}
          </span>
          <span className="text-sm text-muted">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
