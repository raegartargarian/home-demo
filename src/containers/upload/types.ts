import type { StreamCategoryCode } from "@/shared/constants/streams";
import type { UploadPhase } from "@filedgr/web-core/upload";
import type { OriginRect } from "./originRect";

/**
 * Where a record is being filed. Non-null means the modal is open.
 *
 * The stream fields are optional because there are two ways in. A section card
 * knows its stream and fills them, so the modal opens with the destination
 * settled. The vault's own "Add record" button does not — it opens the modal
 * against the vault alone, and the section picker inside supplies the rest.
 *
 * `streamId` is what the backend attaches to; `assetCode` is what the vault and
 * stream pages page through, so both travel together.
 */
export interface UploadTarget {
  vaultId: string;
  streamId?: string;
  assetCode?: string;
  /** Section label ("Maintenance & Upgrades"), shown in the modal title. */
  streamLabel?: string;
  /**
   * Which of the five sections this is, resolved once where the stream is still
   * in hand. `assetCode` is a ledger identity and cannot be resolved back to a
   * section, so the modal cannot work this out for itself.
   */
  sectionCode?: StreamCategoryCode;
  ledger: string;
}

/** What the modal hands the saga: one already-packaged file, plus its metadata. */
export interface UploadRequest {
  name: string;
  description?: string;
  /** A single file — several picked files are zipped before dispatch. */
  file: File;
  filename: string;
  streamId: string;
  assetCode: string;
  ledger: string;
  /** EIP-55 checksummed wallet address of the uploader. */
  networkOwner: string;
}

/**
 * What the corner tray shows about a run, and where it flies from.
 *
 * Deliberately separate from the run fields below: those describe an upload in
 * flight and are cleared the moment it ends, whereas the card outlives it so a
 * finished record can still be seen — and opened — before it is dismissed.
 */
export interface UploadCard {
  /** The canonical record name, as filed. */
  title: string;
  /** The section it was filed into. */
  subtitle?: string;
  /** Where the card animates out of — the submit button's rect. */
  originRect?: OriginRect;
  /** Both halves of the section's URL, so the card can offer to open it. */
  vaultId: string;
  assetCode: string;
}

export interface UploadState {
  target: UploadTarget | null;
  status: "idle" | "running" | "paused";
  phase: UploadPhase | null;
  /** 0-100, as reported by the library across all five phases. */
  progress: number;
  /** Only set for multipart uploads, where "part n of m" is worth showing. */
  parts: { current: number; total: number } | null;
  error: string | null;
  /**
   * Stamped on every completed upload so whichever page is showing that stream
   * can refetch it. A timestamp rather than a flag: two uploads into the same
   * stream must both be observable.
   */
  completed: { assetCode: string; at: number } | null;
  /** The tray card, from submit until it is dismissed or replaced. */
  card: UploadCard | null;
  /**
   * Whether the run behind the current card finished. Needed because `status`
   * falls back to "idle" when a run ends, which on its own cannot tell a
   * finished upload from one that never started.
   */
  succeeded: boolean;
}
