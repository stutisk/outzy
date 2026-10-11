import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonBaseProps = {
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  showArrow?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
};

type ButtonAsButton = ButtonBaseProps & {
  href?: undefined;
  onClick?: () => void;
  type?: "button" | "submit";
};

type ButtonAsLink = ButtonBaseProps & {
  href: string;
  onClick?: undefined;
  type?: undefined;
};

export type ButtonProps = (ButtonAsButton | ButtonAsLink) & {
  variant?: "primary" | "secondary" | "ghost";
  onDark?: boolean;
};

export function Button({
  variant = "primary",
  onDark = false,
  className,
  children,
  disabled,
  showArrow = true,
  fullWidth = false,
  loading = false,
  ...rest
}: ButtonProps) {
  const primaryClass =
    "inline-flex items-center justify-center gap-2 bg-ink px-6 py-3.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-50";

  const secondaryClass = onDark
    ? "inline-flex items-center justify-center gap-1.5 text-sm font-medium text-surface underline underline-offset-4 decoration-surface/80 hover:decoration-surface disabled:opacity-50"
    : "inline-flex items-center justify-center gap-1.5 text-sm font-medium text-ink underline underline-offset-4 decoration-ink/40 hover:decoration-ink disabled:opacity-50";

  const ghostClass =
    "inline-flex items-center justify-center gap-2 border-hairline bg-surface px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-background disabled:opacity-50";

  const classes = cn(
    variant === "primary"
      ? primaryClass
      : variant === "ghost"
        ? ghostClass
        : secondaryClass,
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {loading ? (
        <span
          className="size-4 animate-spin border-2 border-current/30 border-t-current"
          aria-hidden
        />
      ) : null}
      {children}
      {showArrow && !loading ? <span aria-hidden>→</span> : null}
    </>
  );

  const isDisabled = disabled || loading;

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={rest.type ?? "button"}
      onClick={rest.onClick}
      disabled={isDisabled}
      className={classes}
    >
      {content}
    </button>
  );
}
