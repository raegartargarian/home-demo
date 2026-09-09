import { FacetCode, RECORD_FACETS } from "@/shared/constants/recordFacets";
import { RoomCode, roomForCode } from "@/shared/constants/rooms";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { RecordFilter } from "./recordFilter";

/**
 * The active filter, read from and written to the URL.
 *
 * Same reasoning as `useLens`: a filtered section is a view worth linking to
 * and worth surviving a refresh, but it is not a place to go back to — so the
 * history entry is replaced rather than pushed, and the browser Back button
 * still leaves the section rather than unwinding a dozen chip taps.
 *
 * Unknown values in the URL are dropped, not carried, so a hand-edited or
 * outdated link degrades to a wider view instead of an empty one.
 */

const FACET_PARAM = "facet";
const ROOM_PARAM = "room";

const read = <T>(
  param: string | null,
  isValid: (value: string) => boolean,
): T[] =>
  (param ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value && isValid(value)) as T[];

const isFacet = (value: string) =>
  RECORD_FACETS.some((facet) => facet.code === value);

export const useRecordFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const facetParam = searchParams.get(FACET_PARAM);
  const roomParam = searchParams.get(ROOM_PARAM);

  const filter: RecordFilter = useMemo(
    () => ({
      facets: read<FacetCode>(facetParam, isFacet),
      rooms: read<RoomCode>(roomParam, (value) => roomForCode(value) !== null),
    }),
    [facetParam, roomParam],
  );

  const setFilter = useCallback(
    (next: RecordFilter) => {
      // Built from the *current* params rather than the ones captured when this
      // callback was made: two chips toggled inside one tick both read the same
      // stale snapshot, and the second write silently dropped the first.
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);

          // An empty axis leaves no trace in the URL — a bare `?facet=` is
          // noise in a link someone is going to paste to somebody else.
          for (const [key, values] of [
            [FACET_PARAM, next.facets],
            [ROOM_PARAM, next.rooms],
          ] as const) {
            if (values.length > 0) params.set(key, values.join(","));
            else params.delete(key);
          }

          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [filter, setFilter] as const;
};
