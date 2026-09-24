import { isRecordManifest } from "@/shared/utils/recordManifest";
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

/**
 * The zip, and the `home_record.json` the capture form packs into it. Both
 * describe the record rather than being one of its documents.
 */
const isPackaging = (file: RecordFile): boolean =>
  isZip(file) || isRecordManifest(file.filename);

/** The files of a record that are worth showing: everything but packaging. */
export const previewableFiles = (attachment: Attachment): RecordFile[] =>
  (attachment.files ?? []).filter((file) => !isPackaging(file));
