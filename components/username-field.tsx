"use client";

import {
  USERNAME_MAX,
  normalizeUsername,
  validateUsername,
} from "@/lib/username-validation";

type UsernameFieldProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  showError?: boolean;
};

export function UsernameField({
  id = "username",
  name = "username",
  value,
  onChange,
  onBlur,
  disabled,
  autoFocus,
  placeholder = "yourname",
  className = "w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all",
  showError = true,
}: UsernameFieldProps) {
  const trimmed = normalizeUsername(value);
  const length = trimmed.length;
  const validationError = length > 0 ? validateUsername(value) : null;

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-slate-900">
          Username *
        </label>
        <span
          className={`text-xs tabular-nums ${
            length > USERNAME_MAX ? "font-semibold text-red-600" : "text-stone-500"
          }`}
          aria-live="polite"
        >
          {length}/{USERNAME_MAX}
        </span>
      </div>
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        maxLength={USERNAME_MAX}
        autoComplete="username"
        autoFocus={autoFocus}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={className}
        aria-invalid={showError && validationError ? true : undefined}
        aria-describedby={showError && validationError ? `${id}-error` : undefined}
      />
      {showError && validationError ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-600" role="alert">
          {validationError}
        </p>
      ) : (
        <p className="mt-2 text-xs text-stone-500">
          {USERNAME_MAX} characters max. Letters, numbers, and underscores.
        </p>
      )}
    </div>
  );
}
