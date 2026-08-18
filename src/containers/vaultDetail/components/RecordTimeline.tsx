import { LoadingIndicator } from "@/shared/components/LoadingIndicator";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import { groupByYear } from "@/shared/utils/recordLens";
import { CalendarRange, Layers, Lock } from "lucide-react";
import React, { useMemo } from "react";
import { Attachment } from "../types";
import { SectionResolver } from "./recordSection";
import ServiceRecordCard from "./ServiceRecordCard";

interface RecordTimelineProps {
  records: Attachment[];
  sectionOf: SectionResolver;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

/**
 * The house's biography: every record in the vault, newest first, whichever
 * section it is filed in.
 *
 * The section a record belongs to is not lost in the regrouping — each row is
 * wrapped in `data-category`, which repoints the `--cat-*` variables exactly as
 * `StreamCard` does, so the rail dot, the chip and the card's own accent all
 * take the colour of the section the record lives in. The timeline gets its
 * colour coding for free, and the Personal Vault's lock travels with it.
 */
export const RecordTimeline: React.FC<RecordTimelineProps> = ({
  records,
  sectionOf,
  hasMore,
  isLoading,
  onLoadMore,
}) => {
  const years = useMemo(() => groupByYear(records), [records]);

  const sentinelRef = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore,
  });

  if (records.length === 0 && !isLoading) {
    return (
      <div className="rounded-xl border border-line bg-surface-raised p-12 text-center shadow-sm">
        <CalendarRange className="mx-auto mb-3 h-10 w-10 text-ink-subtle" />
        <h3 className="text-base font-medium tracking-tight text-ink">
          Nothing on the record yet
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          As records are filed into the sections, they appear here in the order
          they happened.
        </p>
      </div>
    );
  }

  return (
    <div>
      {years.map(({ year, records: inYear }) => (
        <section key={year ?? "undated"} className="mb-2">
          <h3 className="sticky top-16 z-10 -mx-1 bg-surface-sunken/90 px-1 py-2 text-sm font-medium tabular-nums text-ink-subtle backdrop-blur-sm">
            {year ?? "Undated"}
          </h3>

          {/* The rail. One hairline for the year, a dot per record. */}
          <ol className="relative ml-[7px] border-l border-line pl-6">
            {inYear.map((record) => {
              const category = sectionOf(record);
              return (
                <li
                  key={record.id}
                  data-category={category?.code}
                  className="relative pb-3 last:pb-0"
                >
                  <span
                    aria-hidden
                    className="absolute -left-[31px] top-[26px] h-2.5 w-2.5 rounded-full bg-cat ring-4 ring-surface-sunken"
                  />

                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-cat-ink">
                    {category ? (
                      <category.icon className="h-3 w-3" aria-hidden />
                    ) : (
                      <Layers className="h-3 w-3" aria-hidden />
                    )}
                    {category?.label ?? "Other records"}
                    {category && !category.transfersOnSale && (
                      <Lock
                        className="h-3 w-3"
                        aria-label="Private — detached at sale"
                      />
                    )}
                  </p>

                  <ServiceRecordCard attachment={record} />
                </li>
              );
            })}
          </ol>
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

export default RecordTimeline;
