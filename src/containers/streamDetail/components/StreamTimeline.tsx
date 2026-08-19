import FileShelf from "@/containers/vaultDetail/components/FileShelf";
import { sectionTiles } from "@/containers/vaultDetail/components/sectionTiles";
import { Attachment } from "@/containers/vaultDetail/types";
import { LoadingIndicator } from "@/shared/components/LoadingIndicator";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import { groupByPeriod } from "@/shared/utils/recordLens";
import React, { useMemo } from "react";

interface StreamTimelineProps {
  records: Attachment[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

/**
 * Everything filed in one section, in the order it happened.
 *
 * Files, not records. A record is how an upload was packaged — deed, survey and
 * plat map arriving together as one — and making the reader open a record to
 * find out which documents are inside it is a filing cabinet's problem, not the
 * homeowner's. The section already shows its shelf this way on the vault page;
 * this is the same shelf with every year on it.
 *
 * Grouping is by time rather than by record for the same reason. What a person
 * remembers about a document is roughly when it happened, so that is the axis
 * worth spending a heading on.
 *
 * How finely, though, depends on the section. A year heading over a section
 * whose records all landed this year is one heading over everything: it costs a
 * row and tells the reader nothing. `groupByPeriod` reads the spread and picks
 * the granularity — years where there are years, months inside a single year,
 * days inside a single month.
 */
export const StreamTimeline: React.FC<StreamTimelineProps> = ({
  records,
  hasMore,
  isLoading,
  onLoadMore,
}) => {
  // Grouped first, flattened per group: a file inherits the date of the record
  // it arrived in, so the year is settled before the files are unpacked.
  const periods = useMemo(
    () =>
      groupByPeriod(records).map((group) => ({
        key: group.key,
        label: group.label,
        tiles: sectionTiles(group.records),
      })),
    [records],
  );

  // The viewer pages through the whole section in reading order, which is the
  // years already sorted newest-first and flattened back out.
  const allTiles = useMemo(
    () => periods.flatMap((group) => group.tiles),
    [periods],
  );

  const sentinelRef = useInfiniteScroll({ hasMore, isLoading, onLoadMore });

  return (
    <div>
      {periods.map(({ key, label, tiles }) => (
        <section key={key ?? "undated"} className="mb-6 last:mb-0">
          <h3 className="sticky top-16 z-10 -mx-1 mb-3 bg-surface/90 px-1 py-2 text-sm font-medium tabular-nums text-ink-subtle backdrop-blur-sm">
            {label}
            <span className="ml-2 text-ink-subtle/70">
              {tiles.length} file{tiles.length !== 1 ? "s" : ""}
            </span>
          </h3>

          {/* The rail: one hairline per period, which is what the eye follows
              down the page. A dot per entry would mean a dot per file here, and
              a hundred dots is texture rather than a timeline.

              `scope` is every file in the section, not just this period's, so
              the viewer's arrows carry on across a heading rather than stopping
              at one the reader cannot see. */}
          <FileShelf
            tiles={tiles}
            scope={allTiles}
            className="ml-[7px] border-l border-line py-1 pl-6 sm:grid-cols-4 lg:grid-cols-6"
          />
        </section>
      ))}

      {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
      {isLoading && (
        <div className="mt-6 flex w-full items-center justify-center">
          <LoadingIndicator />
        </div>
      )}
    </div>
  );
};

export default StreamTimeline;
