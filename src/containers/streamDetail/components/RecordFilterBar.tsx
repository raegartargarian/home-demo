import { Button } from "@/components/ui/button";
import { Attachment } from "@/containers/vaultDetail/types";
import { FilterChip } from "@/shared/components/FilterChip";
import { FIELD_CLASS } from "@/shared/components/FormField";
import { RECORD_FACETS } from "@/shared/constants/recordFacets";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import React, { useMemo } from "react";
import {
  EMPTY_FILTER,
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
 * Above them, a box for the words a person remembers instead — the plumber's
 * name, "leak", the model number they typed into the description. It follows
 * the same rule as the rows: one record is not a choice, so it is not drawn.
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
  // A query that arrived in a link keeps its box even over a single record, or
  // there would be a filter on with nothing on the page to take it off.
  const showSearch = records.length >= MIN_OPTIONS || filter.query !== "";
  const active = isFilterActive(filter);

  if (!showFacets && !showRooms && !showSearch) return null;

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          {showSearch && (
            <div className="relative max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle"
                aria-hidden
              />
              <input
                type="search"
                value={filter.query}
                onChange={(event) =>
                  onChange({ ...filter, query: event.target.value })
                }
                placeholder="Search names and descriptions"
                aria-label="Search this section's records"
                className={cn(FIELD_CLASS, "pl-9")}
              />
            </div>
          )}

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
            onClick={() => onChange(EMPTY_FILTER)}
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
