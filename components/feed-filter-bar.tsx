"use client";

import { useEffect, useRef, useState } from "react";
import { List, Map, Search, SlidersHorizontal } from "lucide-react";
import {
  WHEN_FILTER_LABEL,
  type CategoryChipId,
  type WhenFilter,
} from "@/lib/feed-filters";

type FeedFilterBarProps = {
 
  categoryChip: CategoryChipId;
  onCategoryChip: (id: CategoryChipId) => void;
  chips: { id: CategoryChipId; label: string }[];
  viewMode: "list" | "map";
  onViewMode: (mode: "list" | "map") => void;
  whenFilter: WhenFilter;
  onWhenFilter: (w: WhenFilter) => void;
  counts: { upcoming: number; past: number };
  geoStatus: "loading" | "success" | "denied" | "unavailable";
};

export function FeedFilterBar({

  categoryChip,
  onCategoryChip,
  chips,
  viewMode,
  onViewMode,
  whenFilter,
  onWhenFilter,
  counts,
  geoStatus,
}: FeedFilterBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [moreOpen]);

  return (
    <div
      className="sticky top-[3.25rem] z-30 -mx-4  bg-[#faf9f7]/95 px-4 py-2 backdrop-blur-md "
    >
      <div className="flex h-12 items-center gap-2">
       

        <div
          className="feed-filter-scroll relative flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto sm:flex-none sm:overflow-visible"
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-linear-to-r from-[#faf9f7] to-transparent sm:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-[#faf9f7] to-transparent sm:hidden"
            aria-hidden
          />
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onCategoryChip(chip.id)}
              className={`shrink-0 snap-start rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                categoryChip === chip.id
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => onViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={`rounded-full p-2 ${viewMode === "list" ? "bg-coral-50 text-coral" : "text-stone-500"}`}
            aria-label="List view"
          >
            <List className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => onViewMode("map")}
            aria-pressed={viewMode === "map"}
            className={`rounded-full p-2 ${viewMode === "map" ? "bg-coral-50 text-coral" : "text-stone-500"}`}
            aria-label="Map view"
          >
            <Map className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="relative shrink-0" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            className={`inline-flex h-10 max-w-[9.5rem] items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold sm:max-w-none sm:px-3 ${
              whenFilter === "upcoming"
                ? "border-stone-200 bg-white text-stone-700"
                : "border-coral/40 bg-coral-50 text-coral"
            }`}
            aria-expanded={moreOpen}
            aria-label={`More filters, showing ${WHEN_FILTER_LABEL[whenFilter]} plans`}
          >
            <SlidersHorizontal className="size-3.5 shrink-0" strokeWidth={1.5} />
            <span className="hidden truncate sm:inline">More filters</span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none sm:text-[11px] ${
                whenFilter === "upcoming"
                  ? "bg-stone-100 text-stone-700"
                  : "bg-coral text-white"
              }`}
            >
              {WHEN_FILTER_LABEL[whenFilter]}
            </span>
          </button>
          {moreOpen ? (
            <div
              className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-3 shadow-lg"
              role="dialog"
              aria-label="More filters"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                When
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(
                  [
                    { id: "upcoming" as const, label: `Upcoming (${counts.upcoming})` },
                    { id: "past" as const, label: `Past (${counts.past})` },
                    {
                      id: "all" as const,
                      label: `All (${counts.upcoming + counts.past})`,
                    },
                  ] as const
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onWhenFilter(id);
                      setMoreOpen(false);
                    }}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      whenFilter === id
                        ? "bg-coral text-white"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-stone-500">
                Location:{" "}
                {geoStatus === "success"
                  ? "Using your position for sort"
                  : geoStatus === "loading"
                    ? "Locating…"
                    : "Distance sort off"}
              </p>
            </div>
          ) : null}
        </div>
      </div>

     
    </div>
  );
}
