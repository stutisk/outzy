import { cn } from "@/lib/cn";

export const fieldInputClass =
  "w-full border-hairline bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium uppercase tracking-widest text-ink"
      >
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(fieldInputClass, className)} {...props} />;
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(fieldInputClass, "resize-none", className)}
      {...props}
    />
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select className={cn(fieldInputClass, className)} {...props}>
      {children}
    </select>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="border-hairline border-accent/40 bg-highlight/25 px-4 py-3 text-sm text-ink"
      role="alert"
    >
      {message}
    </div>
  );
}
