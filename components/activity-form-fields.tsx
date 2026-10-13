"use client";

import {
  ACTIVITY_DESCRIPTION_MAX,
  ACTIVITY_TITLE_MAX,
  ACTIVITY_TITLE_MIN,
  validateActivityDescription,
  validateActivityTitle,
} from "@/lib/activity-validation";

type ActivityFormFieldsProps = {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  titleId?: string;
  descriptionId?: string;
};

export function ActivityFormFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  titleId = "activity-title",
  descriptionId = "activity-description",
}: ActivityFormFieldsProps) {
  const titleTrim = title.trim();
  const descTrim = description.trim();
  const titleError = titleTrim.length > 0 ? validateActivityTitle(title) : null;
  const descError =
    descTrim.length > 0 ? validateActivityDescription(description) : null;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={titleId} className="text-sm font-semibold text-stone-800">
            Title
          </label>
          <span
            className="text-xs text-stone-500 tabular-nums"
            aria-live="polite"
          >
            {titleTrim.length}/{ACTIVITY_TITLE_MAX}
          </span>
        </div>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={ACTIVITY_TITLE_MAX + 20}
          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral-100"
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? `${titleId}-error` : undefined}
        />
        {titleError ? (
          <p id={`${titleId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
            {titleError}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-stone-500">
            {ACTIVITY_TITLE_MIN}–{ACTIVITY_TITLE_MAX} characters after trim.
          </p>
        )}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label
            htmlFor={descriptionId}
            className="text-sm font-semibold text-stone-800"
          >
            Description
          </label>
          <span
            className="text-xs text-stone-500 tabular-nums"
            aria-live="polite"
          >
            {descTrim.length}/{ACTIVITY_DESCRIPTION_MAX}
          </span>
        </div>
        <textarea
          id={descriptionId}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={5}
          maxLength={ACTIVITY_DESCRIPTION_MAX + 50}
          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral-100"
          aria-invalid={descError ? true : undefined}
          aria-describedby={descError ? `${descriptionId}-error` : undefined}
        />
        {descError ? (
          <p
            id={`${descriptionId}-error`}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {descError}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function isActivityFormValid(title: string, description: string): boolean {
  return (
    validateActivityTitle(title) === null &&
    validateActivityDescription(description) === null &&
    title.trim().length >= ACTIVITY_TITLE_MIN
  );
}
