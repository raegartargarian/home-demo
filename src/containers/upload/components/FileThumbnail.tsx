import { cn } from "@/lib/utils";
import { resolveMime } from "@filedgr/web-core/mime";
import {
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  type LucideIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";

/**
 * A file's own picture, in the list of files about to be filed.
 *
 * The Document box asks what a file is, and a phone or a social feed answers
 * that question with `776222620_2322108331861993_6267282462334264398_n.jpeg`.
 * Four of those in a column are four identical rows: there is nothing to
 * distinguish them, so the question cannot be answered in the order it is
 * asked — you would have to open each file elsewhere, remember which was which,
 * and come back. The thumbnail is what makes the box answerable in place.
 *
 * Images only, because they are the case that has the problem: a PDF's first
 * page would need rendering, and a document named `Summit Roofing invoice.pdf`
 * already says what it is. Everything else gets the icon for its kind, which
 * distinguishes a spreadsheet from a zip at a glance and costs nothing.
 */

const ICONS: [test: (mime: string) => boolean, icon: LucideIcon][] = [
  [(mime) => mime.startsWith("image/"), FileImage],
  [(mime) => mime.startsWith("video/"), FileVideo],
  [
    (mime) => mime === "application/zip" || mime === "application/x-zip-compressed",
    FileArchive,
  ],
  [(mime) => mime.includes("spreadsheet") || mime.includes("excel"), FileSpreadsheet],
];

const iconFor = (mime: string): LucideIcon =>
  ICONS.find(([test]) => test(mime))?.[1] ?? FileText;

interface FileThumbnailProps {
  file: File;
  className?: string;
}

export const FileThumbnail: React.FC<FileThumbnailProps> = ({
  file,
  className,
}) => {
  const mime = resolveMime(file.type, file.name);
  const [url, setUrl] = useState<string | null>(null);
  // HEIC resolves to `image/heic` and decodes in Safari but nowhere else, so
  // whether an image can actually be shown is not knowable from its type. Let
  // the browser answer by trying, and fall back to the icon when it cannot.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!mime.startsWith("image/")) return;

    // Revoked on the way out: fifty of these held open for a form the user may
    // close without filing is fifty files the tab cannot let go of.
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setFailed(false);

    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(null);
    };
  }, [file, mime]);

  const Icon = iconFor(mime);

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-inset",
        className,
      )}
    >
      {url && !failed ? (
        <img
          src={url}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <Icon className="h-4 w-4 text-ink-subtle" aria-hidden />
      )}
    </div>
  );
};

export default FileThumbnail;
