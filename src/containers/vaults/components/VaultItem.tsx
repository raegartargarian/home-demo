import { VaultCard } from "@/shared/components/VaultCard";
import { appRoutes } from "@/shared/constants/routes";
import { VaultDto } from "@/shared/types/vault";
import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * One home, in the list of homes.
 *
 * `VaultCard` names the house the way its own page does — `parseHomeFacts`
 * reads the address out of the vault's description, so the list says "4412
 * Maple Ridge Drive" where it used to say the vault's internal label.
 */
const VaultItem: React.FC<{ vault: VaultDto }> = ({ vault }) => {
  const navigate = useNavigate();

  return (
    <VaultCard
      vault={vault}
      onOpen={() => navigate(`${appRoutes.vaultDetail.name}${vault.id}`)}
    />
  );
};

export default VaultItem;
