import { Badge } from "@/components/ui/badge";
import { VaultImage } from "@/shared/components/VaultImage";
import { appRoutes } from "@/shared/constants/routes";
import { VaultDto } from "@/shared/types/vault";
import { formatDate } from "@/shared/utils/dateFormatter";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import { ArrowRight, Calendar, Layers } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

interface VaultItemProps {
  vault: VaultDto;
}

const VaultItem: React.FC<VaultItemProps> = ({ vault }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`${appRoutes.vaultDetail.name}${vault.id}`);
  };

  const status = vault.status ? getStatusConfig(vault.status) : null;

  return (
    <button
      onClick={handleClick}
      className="w-full h-full flex flex-col text-left bg-surface-raised rounded-xl border border-line hover:border-line-strong transition-colors duration-200 cursor-pointer group overflow-hidden"
    >
      {/* Top half: vault image (with graceful fallback) */}
      <div className="relative h-32 bg-surface-inset flex items-center justify-center overflow-hidden">
        <VaultImage
          vault={vault}
          imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          iconClassName="w-10 h-10 text-ink-subtle"
        />

        {/* Status overlay */}
        {status && (
          <Badge
            variant="secondary"
            className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 shadow-sm ${status.className}`}
          >
            {status.label}
          </Badge>
        )}
      </div>

      {/* Bottom: details */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-medium tracking-tight text-ink truncate text-base mb-3">
          {vault.name}
        </h3>

        {/* Footer: Meta + Arrow */}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-line">
          <div className="flex items-center gap-3">
            {vault.created_at && (
              <span className="flex items-center gap-1 text-xs text-ink-subtle">
                <Calendar className="w-3 h-3" />
                {formatDate(vault.created_at)}
              </span>
            )}
            {vault.streams && vault.streams.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-ink-subtle">
                <Layers className="w-3 h-3" />
                {vault.streams.length}
              </span>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-ink-subtle group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </button>
  );
};

export default VaultItem;
