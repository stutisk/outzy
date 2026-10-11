import { cn } from "@/lib/cn";

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
  /** Lime text on dark sections */
  onDark?: boolean;
  centered?: boolean;
};

export function Eyebrow({
  children,
  className,
  onDark = false,
  centered = false,
}: EyebrowProps) {
  return (
    <p
      className={cn(
        "type-eyebrow flex items-center gap-3",
        centered && "justify-center",
        onDark && "text-highlight",
        className,
      )}
    >
      <span
        className={cn(
          "h-px w-8 shrink-0 bg-current opacity-60",
          onDark && "opacity-90",
        )}
        aria-hidden
      />
      {children}
    </p>
  );
}
