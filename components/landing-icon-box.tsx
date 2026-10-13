import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type LandingIconBoxProps = {
  icon: LucideIcon;
  className?: string;
};

export function LandingIconBox({ icon: Icon, className }: LandingIconBoxProps) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
        className,
      )}
      aria-hidden
    >
      <Icon className="size-5" strokeWidth={1.5} />
    </span>
  );
}
