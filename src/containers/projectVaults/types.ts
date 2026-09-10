import type { VaultDto } from "@/shared/types/vault";

/** One project under a home: the vault, and the label its template carried. */
export interface ProjectVault {
  id: string;
  /** The human name, with the `NV::` plumbing stripped off. */
  label: string;
  templateId: string;
  vault: VaultDto;
}

/** A home's projects, loaded on demand and kept per home. */
export interface ParentProjects {
  projects: ProjectVault[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
}

/** Where the cover photo for a new project comes from. */
export type ProjectImageSource =
  | { kind: "home" }
  | { kind: "file"; file: File };

/** What the create form collects, before any template exists. */
export interface CreateProjectInput {
  parentVaultId: string;
  label: string;
  description: string;
  /**
   * The project's stream names, already in the backend's format.
   *
   * One of the five taxonomy codes, or a slug made from a name someone typed
   * (`toSectionSlug`). The backend does not validate these at all — each one
   * is copied verbatim into a stream's `mapping` — so the format is enforced
   * here, on the way in, and nowhere else.
   */
  sections: string[];
  image: ProjectImageSource;
}

/**
 * A creation in flight — or just finished, or failed — for the card in the
 * grid to show. One at a time across the app: it is the same backend work as
 * creating a home, and that flow already assumes it is the only one running.
 */
export interface ProjectCreation {
  input: CreateProjectInput;
  /** What is happening now, in the homeowner's words. */
  step: string;
  /** 0-100, or null where there is nothing honest to measure. */
  progress: number | null;
  status: "running" | "done" | "failed";
  error: string | null;
  /** Known once the vault exists, so a finished card can open it. */
  vaultId: string | null;
}

export interface ProjectVaultsState {
  byParent: Record<string, ParentProjects>;
  createModal: { parentVaultId: string | null };
  creation: ProjectCreation | null;
}
