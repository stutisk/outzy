import Link from "next/link";
import { cn } from "@/lib/cn";

type ListRowProps = {
  href?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
};

export function ListRow({ href, onClick, className, children }: ListRowProps) {
  const classes = cn(
    "flex w-full items-center gap-3 border-hairline-b bg-surface px-4 py-4 text-left transition-colors hover:bg-background",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
