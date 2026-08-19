import { StreamCategory } from "@/shared/constants/streams";
import { HomeFacts } from "@/shared/types/home";
import { VaultDto, VaultStreamDto } from "@/shared/types/vault";
import { useOutletContext } from "react-router-dom";

/**
 * What every page under a vault reads instead of fetching it again.
 *
 * `VaultShell` resolves the vault, its facts and the open section once and
 * hands them down the outlet, so a section page never asks for the house a
 * second time — and never disagrees with the header about which section is
 * open.
 */
export interface VaultContext {
  vault: VaultDto;
  facts: HomeFacts | null;
  /** The section being viewed, when the route names one. */
  stream: VaultStreamDto | null;
  category: StreamCategory | null;
}

export const useVaultContext = () => useOutletContext<VaultContext>();
