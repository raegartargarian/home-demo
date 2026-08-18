import type { UploadPhase } from "@filedgr/web-core/upload";

/**
 * The stream a record is being filed into. Non-null means the modal is open.
 *
 * `streamId` is what the backend attaches to; `assetCode` is what the vault and
 * stream pages page through, so both travel together.
 */
export interface UploadTarget {
  vaultId: string;
  streamId: string;
  assetCode: string;
  /** Section label ("Maintenance & Upgrades"), shown in the modal title. */
  streamLabel: string;
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
}
