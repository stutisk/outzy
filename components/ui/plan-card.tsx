import Link from "next/link";
import { cn } from "@/lib/cn";

type PlanCardBase = {
  index: string;
  title: string;
  href?: string;
  className?: string;
  onClick?: () => void;
};

type PlanCardHeroProps = PlanCardBase & {
  variant: "hero";
  categoryLabel: string;
  refCode: string;
  schedule: string;
  hostLabel?: string;
  spotsLabel?: string;
};

type PlanCardFeaturedProps = PlanCardBase & {
  variant: "featured";
  eyebrow?: string;
};

export type PlanCardProps = PlanCardHeroProps | PlanCardFeaturedProps;

function PlanGraphic() {
  return (
    <div
      className="relative flex min-h-[10rem] flex-1 items-center justify-center bg-highlight md:min-h-[12rem]"
      aria-hidden
    >
      <svg
        viewBox="0 0 200 120"
        className="absolute inset-0 h-full w-full text-ink/25"
        preserveAspectRatio="none"
      >
        <path
          d="M0 80 Q50 40 100 70 T200 50 L200 120 L0 120 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M0 95 Q60 55 120 85 T200 65"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <span className="relative z-10 size-14 border border-accent bg-accent/25" />
    </div>
  );
}

export function PlanCard(props: PlanCardProps) {
  const { index, title, href, className, onClick } = props;

  const boxClass = cn(
    "block border-hairline bg-surface",
    href && "transition-opacity hover:opacity-95",
    className,
  );

  const inner =
    props.variant === "hero" ? (
      <div className="flex min-h-full flex-col">
        <div className="flex items-center justify-between border-hairline-b px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink">
          <span>{props.categoryLabel}</span>
          <span className="text-muted">{props.refCode}</span>
        </div>
        <PlanGraphic />
        <div className="border-hairline-t px-4 py-5 md:px-5 md:py-6">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted">
            {props.schedule}
          </p>
          <p className="mt-2 font-display text-2xl leading-tight text-ink md:text-[1.75rem]">
            {title}
          </p>
          {(props.hostLabel || props.spotsLabel) && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {props.hostLabel ? <span>{props.hostLabel}</span> : null}
              {props.spotsLabel ? <span>{props.spotsLabel}</span> : null}
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="flex min-h-[18rem] flex-col bg-highlight p-6 md:min-h-[22rem] md:p-8">
        {props.eyebrow ? (
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-ink/80">
            {props.eyebrow}
          </p>
        ) : null}
        <div className="flex flex-1 items-center justify-center py-6">
          <span
            className="font-display text-[5.5rem] leading-none text-accent md:text-[7rem]"
            aria-hidden
          >
            {index}
          </span>
        </div>
        <p className="font-display text-2xl leading-tight text-ink md:text-3xl">
          {title}
        </p>
      </div>
    );

  if (href) {
    return (
      <Link href={href} className={boxClass} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={boxClass} role="group">
      {inner}
    </div>
  );
}

type PlanListItemProps = {
  index: string;
  timeLabel: string;
  title: string;
  href: string;
  className?: string;
};

export function PlanListItem({
  index,
  timeLabel,
  title,
  href,
  className,
}: PlanListItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "grid grid-cols-[2.5rem_1fr] gap-x-3 border-hairline-b py-4 transition-colors hover:bg-surface sm:grid-cols-[2.5rem_6.5rem_1fr] sm:items-baseline sm:gap-x-6",
        className,
      )}
    >
      <span className="text-sm text-muted tabular-nums">{index}</span>
      <span className="text-sm text-muted sm:col-start-2">{timeLabel}</span>
      <span className="col-span-2 font-display text-lg text-ink sm:col-span-1 sm:col-start-3">
        {title}
      </span>
    </Link>
  );
}
