import { getIPFSIMGAddr } from "@/shared/utils/getIPFSAddrs";
import { VaultDto } from "@/shared/types/vault";
import { dataURLtoFile, getCroppedImg } from "@filedgr/web-core/browser";

/** Longest edge of a project cover, in pixels. What the template gets pinned. */
const COVER_MAX_SIZE = 1600;

const naturalSize = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("The photo could not be read."));
    image.src = src;
  });

/**
 * A photo, capped and re-encoded as the JPEG the template will carry.
 *
 * web-core's cropper does the capping; handing it the whole image as the crop
 * is what turns "crop" into "downscale". A 12MP phone photo pinned as-is would
 * be a multi-megabyte cover on every card, and a HEIC would not decode at all.
 */
export const toCoverImage = async (
  source: Blob,
  filename: string
): Promise<File> => {
  const url = URL.createObjectURL(source);
  try {
    const { width, height } = await naturalSize(url);
    const dataUrl = await getCroppedImg(
      url,
      { x: 0, y: 0, width, height },
      { maxSize: COVER_MAX_SIZE }
    );
    return dataURLtoFile(dataUrl, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
};

/** The CID a home is pictured by, or null when it has no picture. */
export const homeImageCid = (
  vault: Pick<VaultDto, "image_cid" | "default_image_cid">
): string | null => vault.image_cid || vault.default_image_cid || null;

/**
 * The home's own photo, fetched back off the public gateway so a project can
 * inherit it. Every home this demo seeds is public; a private home would need
 * the authenticated gateway, and fails here with a message that says to pick
 * a photo instead.
 */
export const fetchHomeImage = async (
  vault: Pick<VaultDto, "image_cid" | "default_image_cid">
): Promise<Blob> => {
  const cid = homeImageCid(vault);
  if (!cid) throw new Error("This home has no photo to reuse.");

  const response = await fetch(getIPFSIMGAddr(cid));
  if (!response.ok) {
    throw new Error(
      "The home's photo could not be fetched. Choose a photo for the project instead."
    );
  }
  return response.blob();
};
