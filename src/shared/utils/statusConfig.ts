import { ChipTone } from "@/shared/components/Chip";

// Maps raw FILEDGR status values (vault / stream / attachment) to a readable
// label and a meaning. Mirrors the label logic in the main filedgr web app
// (entityHelpers.ts) so completed states show a green "Completed" instead of a
// greyed-out raw string. Falls back to a cleaned, title-cased label for
// anything unmapped.

type StatusEntry = { label: string; tone: ChipTone };

// A status is one of four *meanings*; `Chip` decides what each one looks like,
// and `styles/main.scss` decides the palette behind it. This used to hand back
// a className, which meant a caller composing it with a `Badge` variant got
// whichever border rule happened to win on class order.
const GREEN: ChipTone = "verified";
const AMBER: ChipTone = "warn";
const RED: ChipTone = "alert";
const GRAY: ChipTone = "neutral";

const STATUS_CONFIG: Record<string, StatusEntry> = {
  // ---- Vault statuses ----
  FILEDGR_VAULT_COMPLETED: { label: "Completed", tone: GREEN },
  FILEDGR_VAULT_FINISHED: { label: "Completed", tone: GREEN },
  FILEDGR_METADATA_GENERATED: { label: "Completed", tone: GREEN },
  FILEDGR_IMAGE_UPLOADED: { label: "Image Uploaded", tone: AMBER },
  DLT_VAULT_ID_REQUESTED: { label: "Vault ID Requested", tone: AMBER },
  FILEDGR_PAGE_GENERATED: { label: "Page Generated", tone: AMBER },
  DCSTORAGE_PAGE_UPLOAD: { label: "Page Uploaded", tone: AMBER },
  DCSTORAGE_IMAGE_UPLOADED: { label: "Image Uploaded", tone: AMBER },
  FILEDGR_METADATA_GENERATION: { label: "Metadata Generated", tone: AMBER },
  FILEDGR_METADATA_UPLOADED: { label: "Metadata Uploaded", tone: AMBER },

  // ---- Stream statuses ----
  FILEDGR_STREAM_COMPLETED: { label: "Completed", tone: GREEN },
  DLT_MINTED: { label: "Minted", tone: GREEN },
  DLT_STREAM_ID_REQUESTED: { label: "Processing", tone: AMBER },

  // ---- Attachment statuses ----
  FILEDGR_DATA_ATTACHMENT_COMPLETED: { label: "Completed", tone: GREEN },
  DCSTORAGE_REPLICATED: { label: "Replicated", tone: GREEN },
  FILEDGR_UPLOADED: { label: "Uploaded", tone: AMBER },

  // ---- Shared / lifecycle ----
  FILEDGR_RECEIVED: { label: "Received", tone: AMBER },
  FILEDGR_REVIEWED: { label: "Reviewed", tone: AMBER },
  ERROR: { label: "Error", tone: RED },
};

export const getStatusConfig = (status: string): StatusEntry => {
  const key = status.trim().toUpperCase();
  if (STATUS_CONFIG[key]) return STATUS_CONFIG[key];

  // Unknown value: strip known prefixes and title-case so it still reads
  // cleanly rather than dumping the raw string.
  const label = key
    .replace(/^(FILEDGR|DLT|DCSTORAGE)_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return { label, tone: GRAY };
};
