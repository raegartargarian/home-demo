import { Attachment } from "../types";

/**
 * What a record is made of, with no dependency on the preview layer.
 *
 * Kept apart from `useRecordPreview` deliberately: these rules are pure and are
 * worth testing on their own, and importing the preview layer pulls web-core's
 * stylesheet in with it, which a unit test cannot load.
 */

export type RecordFile = NonNullable<Attachment["files"]>[number];

/** The zip is packaging, not content — never a face and never its own tile. */
export const isZip = (file: RecordFile): boolean =>
  /\.zip$/i.test(file.filename ?? "");

/** The files of a record that are worth showing: everything but the bundle. */
export const previewableFiles = (attachment: Attachment): RecordFile[] =>
  (attachment.files ?? []).filter((file) => !isZip(file));
