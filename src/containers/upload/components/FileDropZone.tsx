import { cn } from "@/lib/utils";
import { filesFromDataTransfer } from "@filedgr/web-core/browser";
import { useFolderPicker } from "@filedgr/web-core/react";
import { formatFileSize } from "@filedgr/web-core/format";
import { FolderOpen, UploadCloud } from "lucide-react";
import React, { useRef, useState } from "react";

interface FileDropZoneProps {
  /** Called with everything the user just added — never replaces the set. */
  onFiles: (files: File[]) => void;
  fileCount: number;
  totalBytes: number;
  /** The limits the modal enforces, restated here so the hint cannot drift. */
  maxFiles: number;
  maxTotalBytes: number;
  disabled?: boolean;
}

/**
 * Drop / browse target for the files that make up one record.
 *
 * Dropping a *folder* needs `filesFromDataTransfer` (it walks directory entries
 * recursively); browsing to one needs a second, folder-only input, because
 * `webkitdirectory` makes an input folder-ONLY — no browser has a picker that
 * offers both. Both paths hand back files stamped with a folder-relative path.
 */
export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFiles,
  fileCount,
  totalBytes,
  maxFiles,
  maxTotalBytes,
  disabled,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderPicker = useFolderPicker(onFiles);

  const openFilePicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={async (event) => {
          if (disabled) return;
          event.preventDefault();
          setIsDragActive(false);
          onFiles(await filesFromDataTransfer(event.dataTransfer));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
          isDragActive
            ? "border-cat bg-cat-surface"
            : "border-line bg-surface-sunken hover:border-cat-line hover:bg-cat-surface/40",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <UploadCloud className="h-6 w-6 text-ink-subtle" aria-hidden />
        <p className="text-sm font-medium text-ink">
          {isDragActive
            ? "Drop the files here"
            : fileCount > 0
              ? `${fileCount} file${fileCount !== 1 ? "s" : ""} selected · ${formatFileSize(totalBytes)}`
              : "Drag photos, invoices or manuals here, or click to browse"}
        </p>
        <p className="text-xs text-ink-subtle">
          Up to {maxFiles} files, {formatFileSize(maxTotalBytes)} in total.
          Several files are filed as one record.
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            folderPicker.open();
          }}
          className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-cat-ink underline-offset-2 hover:underline disabled:cursor-not-allowed"
        >
          <FolderOpen className="h-3.5 w-3.5" aria-hidden />
          or select a whole folder
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []));
          // Reset so re-picking the same file fires change again.
          event.target.value = "";
        }}
      />
      {/* Paired with the "select a whole folder" link above. */}
      <input {...folderPicker.inputProps} />
    </div>
  );
};

export default FileDropZone;
