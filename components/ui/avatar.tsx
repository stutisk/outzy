import { cn } from "@/lib/cn";

type AvatarProps = {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "size-8 text-xs",
  md: "size-12 text-sm",
  lg: "size-20 text-2xl",
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initial = name?.charAt(0).toUpperCase() ?? "?";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden border-hairline bg-accent/15 font-medium text-accent",
        sizeClass[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
