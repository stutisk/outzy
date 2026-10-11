import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  title: string;
  accentWord?: string;
  className?: string;
  /** White text on ink background */
  onDark?: boolean;
  as?: "h1" | "h2";
};

export function SectionHeading({
  title,
  accentWord,
  className,
  onDark = false,
  as = "h2",
}: SectionHeadingProps) {
  const Tag = as;

  const renderTitle = () => {
    if (!accentWord || !title.includes(accentWord)) {
      return title;
    }
    const [before, after] = title.split(accentWord);
    return (
      <>
        {before}
        <span className="type-accent-word">{accentWord}</span>
        {after}
      </>
    );
  };

  return (
    <Tag
      className={cn(
        as === "h1" ? "type-display-1" : "type-display-2",
        onDark ? "text-surface" : "text-ink",
        className,
      )}
    >
      {renderTitle()}
    </Tag>
  );
}
