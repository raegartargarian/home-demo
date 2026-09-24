import { recordMeta } from "@/shared/utils/recordLens";
import { parseRecordName, readableDocName } from "@/shared/utils/recordNaming";
import { stripTagLines } from "@/shared/utils/recordTags";
import { Attachment } from "../types";
import { previewableFiles, type RecordFile } from "./recordFiles";

/**
 * The files a section shows on its shelf.
 *
 * A section card shows documents, not bundles: a record carrying a deed, a
 * survey and a plat map is three things the homeowner filed, and collapsing it
 * to one tile hides two of them. So the section flattens its records down to
 * their files.
 *
 * The record does not disappear — it is still what a tile opens, and still what
 * the header counts. It stops being the unit of *display* only.
 */

export interface SectionTile {
  /** The record the file belongs to — what the tile opens. */
  attachment: Attachment;
  file: RecordFile;
  /** What the tile is called. See `labelFor`. */
  label: string;
  /**
   * The homeowner's note on the record, tag lines removed. The record's, not
   * the file's — every tile from one upload carries the same one, because the
   * note was written about the upload.
   */
  note: string;
  /**
   * Whether the record is archived. Only ever true on a shelf that asked for
   * archived records, and then the tile has to say so — an archived receipt
   * standing among live ones with nothing to mark it is the reason it was
   * archived in the first place, back on the shelf.
   */
  archived: boolean;
  key: string;
}

/** "10-07-25 - Receipt - New Carpeting.pdf" → "10-07-25 - Receipt - New Carpeting" */
const stem = (filename: string): string =>
  filename.replace(/\.[^./\\]+$/, "").trim();

/**
 * What to call one file.
 *
 * Where a record holds a single file, the two are the same thing, and the
 * record's own reason ("New Carpeting") beats whatever the scanner called the
 * file ("scan001.pdf"). Where it holds several, the record's name describes all
 * of them equally and so distinguishes none — there the filename is the only
 * thing that says which document this tile is.
 *
 * Files inside a record now carry the convention themselves, which is what
 * makes a set of screenshots readable — but the date, type and project in that
 * name are the same three for every tile in the group, and the group's own
 * heading has already said them. So a canonical filename shows only its last
 * segment: four tiles reading "Condenser unit", "Line set", "Permit",
 * "Invoice" rather than four copies of the same prefix, distinguished at the
 * far right where nothing is scanning.
 */
export const labelFor = (
  attachment: Attachment,
  file: RecordFile,
  siblingCount: number,
): string => {
  const title = recordMeta(attachment).title;
  if (siblingCount <= 1) return title;

  const filename = file.filename ?? "";
  const parsed = parseRecordName(filename);
  // `readableDocName` is for records filed before the double-naming was fixed;
  // it returns an ordinary document name untouched.
  if (parsed) return readableDocName(parsed.docName) || title;
  return stem(filename) || title;
};

/**
 * Flattens a section's records into tiles, in the order the records arrived.
 *
 * Everything is returned and the caller slices: a section card shows six and
 * needs to know whether it is holding any back, and asking this twice — once
 * for the six, once to find out if there was a seventh — was the earlier
 * shape's only way to answer that.
 */
export const sectionTiles = (records: Attachment[]): SectionTile[] => {
  const tiles: SectionTile[] = [];

  for (const attachment of records) {
    const note = stripTagLines(attachment.description);

    // A record whose only file is the bundle still has to appear: this app
    // packs an upload into one zip, so hiding bundles as packaging would hide
    // the whole record with them. Falling back to its own files gives it a
    // single tile under the record's name, which is the truthful reading —
    // one thing was filed.
    const previewable = previewableFiles(attachment);
    const files =
      previewable.length > 0 ? previewable : (attachment.files ?? []);

    for (const [index, file] of files.entries()) {
      tiles.push({
        attachment,
        file,
        label: labelFor(attachment, file, files.length),
        note,
        archived: !!attachment.archived,
        key: `${attachment.id}:${file.cid ?? index}`,
      });
    }
  }

  return tiles;
};
