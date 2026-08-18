import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { uploadSelectors } from "./selectors";

/**
 * Run `onUploaded` once each time a record lands in one of `assetCodes`.
 *
 * The upload modal is mounted app-wide, so the page showing a stream is not the
 * thing that started the upload — this is how it learns to refetch. The last
 * completion is remembered from mount, so arriving on a page after an upload
 * elsewhere does not trigger a spurious refresh.
 */
export function useUploadedInto(
  assetCodes: Array<string | undefined>,
  onUploaded: (assetCode: string) => void
) {
  const completed = useSelector(uploadSelectors.completed);
  const lastSeenAt = useRef<number | null>(completed?.at ?? null);
  // Read through refs so a fresh array or closure on every render cannot
  // re-arm the effect — the completion itself is the only trigger.
  const codes = useRef(assetCodes);
  codes.current = assetCodes;
  const handler = useRef(onUploaded);
  handler.current = onUploaded;

  useEffect(() => {
    if (!completed || completed.at === lastSeenAt.current) return;
    lastSeenAt.current = completed.at;
    if (codes.current.includes(completed.assetCode)) {
      handler.current(completed.assetCode);
    }
  }, [completed]);
}
