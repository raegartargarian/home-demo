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
  /**
   * False renders the faces without their own click, and mounts no viewer —
   * for a shelf inside a card that is itself one target.
   */
  interactive?: boolean;
  className?: string;
}

/**
 * A row of file faces, and the viewer behind them.
 *
 * Both places that show files — a section card on the vault page and a period
 * on the section page — are this component, so the grid cannot drift into two
 * grids.
 *
 * What a click does differs, and deliberately. On the section page a file is
 * the thing you came for, so it opens in the viewer. On a section card it is a
 * preview of what is inside, and the card is one target that opens the section
 * — so those faces are inert and the card takes the click. Opening a viewer
 * from a card meant two destinations on one surface, and which you got
 * depended on hitting a 90px tile.
 */
export const FileShelf: React.FC<FileShelfProps> = ({
  tiles,
  scope,
  interactive = true,
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
              interactive={interactive}
              onOpen={() =>
                preview.openAt(
                  entries.findIndex((entry) => entry.key === tile.key),
                )
              }
            />
          </li>
        ))}
      </ul>

      {interactive && (
        <FilePreviewModal
          entries={entries}
          index={preview.index}
          onNavigate={preview.navigate}
          onClose={preview.close}
        />
      )}
    </>
  );
};

export default FileShelf;
