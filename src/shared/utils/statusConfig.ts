// Maps raw FILEDGR status values (vault / stream / attachment) to readable
// labels + color styling. Mirrors the label/color logic in the main filedgr
// web app (entityHelpers.ts) so completed states show a green "Completed"
// instead of a greyed-out raw string. Shared across the vault list and detail
// views. Falls back to a cleaned, title-cased label for anything unmapped.
type StatusEntry = { label: string; className: string };

// Semantic tokens, not raw ramps: a status is one of four *meanings*, and the
// palette that renders those meanings is decided once in `styles/main.scss`.
const GREEN = "bg-verified-surface text-verified border-verified-line";
const AMBER = "bg-warn-surface text-warn border-warn-line";
const RED = "bg-alert-surface text-alert border-alert-line";
const GRAY = "bg-surface-inset text-ink-muted border-line";

const STATUS_CONFIG: Record<string, StatusEntry> = {
  // ---- Vault statuses ----
  FILEDGR_VAULT_COMPLETED: { label: "Completed", className: GREEN },
  FILEDGR_VAULT_FINISHED: { label: "Completed", className: GREEN },
  FILEDGR_METADATA_GENERATED: { label: "Completed", className: GREEN },
  FILEDGR_IMAGE_UPLOADED: { label: "Image Uploaded", className: AMBER },
  DLT_VAULT_ID_REQUESTED: { label: "Vault ID Requested", className: AMBER },
  FILEDGR_PAGE_GENERATED: { label: "Page Generated", className: AMBER },
  DCSTORAGE_PAGE_UPLOAD: { label: "Page Uploaded", className: AMBER },
  DCSTORAGE_IMAGE_UPLOADED: { label: "Image Uploaded", className: AMBER },
  FILEDGR_METADATA_GENERATION: { label: "Metadata Generated", className: AMBER },
  FILEDGR_METADATA_UPLOADED: { label: "Metadata Uploaded", className: AMBER },

  // ---- Stream statuses ----
  FILEDGR_STREAM_COMPLETED: { label: "Completed", className: GREEN },
  DLT_MINTED: { label: "Minted", className: GREEN },
  DLT_STREAM_ID_REQUESTED: { label: "Processing", className: AMBER },

  // ---- Attachment statuses ----
  FILEDGR_DATA_ATTACHMENT_COMPLETED: { label: "Completed", className: GREEN },
  DCSTORAGE_REPLICATED: { label: "Replicated", className: GREEN },
  FILEDGR_UPLOADED: { label: "Uploaded", className: AMBER },

  // ---- Shared / lifecycle ----
  FILEDGR_RECEIVED: { label: "Received", className: AMBER },
  FILEDGR_REVIEWED: { label: "Reviewed", className: AMBER },
  ERROR: { label: "Error", className: RED },
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
  return { label, className: GRAY };
};
