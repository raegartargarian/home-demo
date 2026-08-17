import { VaultDto } from "@/shared/types/vault";
import { getIPFSIMGAddr } from "@/shared/utils/getIPFSAddrs";
import { Home } from "lucide-react";
import React, { useState } from "react";

interface VaultImageProps {
  vault: Pick<VaultDto, "image_cid" | "default_image_cid" | "name">;
  /** Classes for the <img> when an image is available. */
  imgClassName?: string;
  /** Classes for the fallback Home icon (no image / load error). */
  iconClassName?: string;
}

/**
 * Renders a vault's image (resolved from image_cid, falling back to
 * default_image_cid via IPFS), with a graceful Home-icon fallback when there's
 * no CID or the image fails to load. Used by the vault list card and the vault
 * detail header.
 */
export const VaultImage: React.FC<VaultImageProps> = ({
  vault,
  imgClassName = "",
  iconClassName = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const imageCid = vault.image_cid || vault.default_image_cid;
  const imageUrl = imageCid ? getIPFSIMGAddr(imageCid) : null;

  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={vault.name}
        onError={() => setImageError(true)}
        className={imgClassName}
      />
    );
  }

  return <Home className={iconClassName} />;
};

export default VaultImage;
