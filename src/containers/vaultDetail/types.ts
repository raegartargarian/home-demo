import { VaultDto } from "@/shared/types/vault";

/**
 * A section being added to the vault, for the card that holds its place in the
 * grid. One at a time: the backend anchors a stream on the chain, and a second
 * one started underneath the first would give the grid two placeholders and no
 * way to tell which finished.
 *
 * There is no "done" state. A finished section *is* its own card — the saga
 * puts the refreshed vault in the store and this clears, so the placeholder is
 * replaced by the real thing rather than sitting beside it.
 */
export interface SectionCreation {
  vaultId: string;
  /** The slug the backend stores as the stream's `mapping`. */
  mapping: string;
  /** What to call it while it has no stream to resolve a label from. */
  label: string;
  status: "running" | "failed";
  error: string | null;
  /**
   * Whether "Try again" is offered. False once the stream exists — a retry
   * would ask for a second section under the same name, which is not what
   * "try again" means to the person reading it.
   */
  retryable: boolean;
}

/** What the add-section form hands the saga. */
export interface AddSectionInput {
  vaultId: string;
  /** One of the five taxonomy codes, or a slug from a name someone typed. */
  mapping: string;
  /** The name as the app shows it, for the placeholder card. */
  label: string;
  description: string;
}

export interface VaultDetailState {
  vault: VaultDto | null;
  /**
   * Every vault above this one, root-first, excluding itself — so a home is
   * `[]`, a project of a home is `[home]`, and a project of that project is
   * `[home, project]`. The immediate parent is the last entry; read it through
   * `vaultDetailSelectors.parent` rather than indexing here.
   *
   * Resolved best-effort by the saga: a broken template link truncates the
   * chain rather than failing the page, so this can be shorter than the truth
   * but never longer.
   */
  ancestors: VaultDto[];
  isLoading: boolean;
  error: string | null;
  /** Which vault the add-section form is open for, or null when it is shut. */
  addSectionModal: { vaultId: string | null };
  sectionCreation: SectionCreation | null;
  /** Every record in the vault, for the Timeline and Projects lenses. Paged
   *  separately from the vault itself, which the Sections lens alone needs. */
}

/** Service-record (attachment) shape used by the stream accordion and the
 * service-record list card. The full detail-page shape lives in
 * src/containers/serviceRecord/types.ts. */
export interface Attachment {
  id: string;
  name?: string;
  description?: string | null;
  created_at?: string;
  status?: string;
  file_count?: number;
  size?: number;
  /** `cid` is optional: the list endpoint omits it for records that have not
   *  finished pinning. Present, it lets the card render a real thumbnail
   *  (video frame, photo, first PDF page) instead of a type glyph. */
  files?: Array<{ filename?: string; mimetype?: string; cid?: string }>;
  tx_hash?: string | null;
  ledger?: string;
  public_vault?: boolean;
  /** Archived records are left out of a section unless asked for. */
  archived?: boolean;
  /** Present on the vault-wide list, which is not scoped to one stream. */
  stream_id?: string;
  stream?: { asset_code?: string };
}
