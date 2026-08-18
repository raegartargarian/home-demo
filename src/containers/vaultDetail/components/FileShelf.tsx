import { cn } from "@/lib/utils";
import { TILE_GRID_CLASS } from "@/shared/components/FileTile";
import {
  FilePreviewModal,
  useFilePreview,
} from "@/shared/components/FilePreviewModal";
import React from "react";
import RecordFileTile from "./RecordFileTile";
import { SectionTile } from "./sectionTiles";

interface FileShelfProps {
  /** The tiles this shelf renders. */
  tiles: SectionTile[];
  /**
   * The set the preview's arrows walk. Defaults to the rendered tiles; the
   * stream page passes the whole section so paging does not stop at the end of
   * a year.
   */
  scope?: SectionTile[];
  className?: string;
}

/**
 * A row of file faces, and the viewer behind them.
 *
 * Both places that show files — a section card on the vault page and a year on
 * the stream page — are this component, so clicking a document behaves the same
 * way in both, and the grid cannot drift into two grids.
 */
export const FileShelf: React.FC<FileShelfProps> = ({
  tiles,
  scope,
  className,
}) => {
  const entries = scope ?? tiles;
  const preview = useFilePreview();

  return (
    <>
      <ul className={cn(TILE_GRID_CLASS, className)}>
        {tiles.map((tile) => (
          <li key={tile.key}>
            <RecordFileTile
              attachment={tile.attachment}
              file={tile.file}
              label={tile.label}
              onOpen={() =>
                preview.openAt(
                  entries.findIndex((entry) => entry.key === tile.key),
                )
              }
            />
          </li>
        ))}
      </ul>

      <FilePreviewModal
        entries={entries}
        index={preview.index}
        onNavigate={preview.navigate}
        onClose={preview.close}
      />
    </>
  );
};

export default FileShelf;
