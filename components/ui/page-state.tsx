import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function PageLoadingScreen({ label }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Spinner label={label} />
    </main>
  );
}

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-hairline bg-surface px-6 py-12 text-center md:px-10 md:py-14",
        className,
      )}
    >
      <p className="font-display text-xl text-ink">{title}</p>
      {description ? (
        <p className="type-body-sm mx-auto mt-3 max-w-sm">{description}</p>
      ) : null}
      {actionLabel && (onAction || actionHref) ? (
        <div className="mt-8 flex justify-center">
          {actionHref ? (
            <Button href={actionHref}>{actionLabel}</Button>
          ) : (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function InlineLoading({ label }: { label?: string }) {
  return (
    <div className="flex justify-center py-16">
      <Spinner label={label} />
    </div>
  );
}

export function NotFoundPanel({
  title = "Not found",
  description = "This page may have moved or you may not have access.",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}
