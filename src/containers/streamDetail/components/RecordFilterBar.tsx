import { Button } from "@/components/ui/button";
import { Attachment } from "@/containers/vaultDetail/types";
import { FilterChip } from "@/shared/components/FilterChip";
import { RECORD_FACETS } from "@/shared/constants/recordFacets";
import React, { useMemo } from "react";
import {
  facetOptions,
  isFilterActive,
  RecordFilter,
  roomOptions,
  toggle,
} from "./recordFilter";

interface RecordFilterBarProps {
  records: Attachment[];
  filter: RecordFilter;
  onChange: (filter: RecordFilter) => void;
  /** True while the remaining pages are still arriving. */
  isLoading?: boolean;
  className?: string;
}

/** A group is only worth a row if it offers a real choice. */
const MIN_OPTIONS = 2;

/**
 * The section's filter bar: what a document is, and where the work was.
 *
 * Both rows are built from the records actually on the page, so the bar never
 * offers a chip that empties it, and a section with one kind of document shows
 * no row at all rather than a single chip that does nothing.
 *
 * The rows scroll horizontally, which nothing else in the app does — but a
 * section can surface seven facets and a dozen rooms, and on a phone that is
 * well past the viewport.
 */
export const RecordFilterBar: React.FC<RecordFilterBarProps> = ({
  records,
  filter,
  onChange,
  isLoading,
  className,
}) => {
  const facets = useMemo(
    () => facetOptions(records, filter),
    [records, filter],
  );
  const rooms = useMemo(() => roomOptions(records, filter), [records, filter]);

  // Kept in the taxonomy's own order rather than the order records happened to
  // arrive in, so the bar does not reshuffle itself as more pages load.
  const facetChips = useMemo(
    () =>
      RECORD_FACETS.flatMap((facet) => {
        const option = facets.find((entry) => entry.code === facet.code);
        return option ? [{ facet, count: option.count }] : [];
      }),
    [facets],
  );

  const showFacets = facetChips.length >= MIN_OPTIONS;
  const showRooms = rooms.length >= MIN_OPTIONS;
  const active = isFilterActive(filter);

  if (!showFacets && !showRooms) return null;

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          {showFacets && (
            <div
              role="group"
              aria-label="Filter by document type"
              className="flex gap-1.5 overflow-x-auto pb-0.5"
            >
              {facetChips.map(({ facet, count }) => (
                <FilterChip
                  key={facet.code}
                  label={facet.label}
                  icon={facet.icon}
                  count={count}
                  isActive={filter.facets.includes(facet.code)}
                  onToggle={() =>
                    onChange({
                      ...filter,
                      facets: toggle(filter.facets, facet.code),
                    })
                  }
                />
              ))}
            </div>
          )}

          {showRooms && (
            <div
              role="group"
              aria-label="Filter by room"
              className="flex gap-1.5 overflow-x-auto pb-0.5"
            >
              {rooms.map(({ room, count }) => (
                <FilterChip
                  key={room.code}
                  label={room.label}
                  count={count}
                  isActive={filter.rooms.includes(room.code)}
                  onToggle={() =>
                    onChange({
                      ...filter,
                      rooms: toggle(filter.rooms, room.code),
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>

        {active && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => onChange({ facets: [], rooms: [] })}
            className="shrink-0"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Grouping or filtering over a half-loaded section would under-report,
          so the page pulls the rest in for either. Say so while it does — and
          say it whether or not a chip is on, because grouping by project starts
          the same wait with the bar untouched. */}
      {isLoading && (
        <p className="mt-2 text-xs text-ink-subtle">
          Loading the rest of this section…
        </p>
      )}
    </div>
  );
};

export default RecordFilterBar;
