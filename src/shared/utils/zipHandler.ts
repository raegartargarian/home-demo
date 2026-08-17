import JSZip from "jszip";
import { HomeRecordManifest } from "@/shared/types/home";

/**
 * Parsed contents of a single home record bundle. `HomeRecordData` mirrors the
 * `home_record.json` manifest (see src/shared/types/home.ts) but with tolerant
 * key fallbacks so slightly different manifests still render.
 */
export type HomeRecordData = HomeRecordManifest;

export interface RecordImage {
  type: "before" | "after";
  category: string; // e.g. "Kitchen", "Roof", "Bathroom"
  sequence: number; // for multiple images of the same category
  filename: string;
  url?: string;
}

export interface RecordDocument {
  name: string;
  type: string; // extracted from filename (e.g. "receipt", "permit", "warranty")
  filename: string;
  content?: ArrayBuffer;
  url?: string;
}

export interface ProcessedHomeData {
  type: "home-record";
  recordData: HomeRecordData[];
  images: RecordImage[];
  documents: RecordDocument[];
  imageMatches: Array<{
    category: string;
    sequence: number;
    before?: RecordImage;
    after?: RecordImage;
  }>;
}

function parseHomeJSON(content: string): HomeRecordData[] {
  try {
    const json = JSON.parse(content);
    const records = Array.isArray(json) ? json : [json];

    return records.map((r: any) => {
      const info = r.recordInfo || r.projectInfo || r.record || r;
      return {
        recordInfo: {
          name: info.name || info.title || r.name,
          type: info.type || r.type || "renovation",
          collection: info.collection || info.project || r.collection,
          rooms: info.rooms || info.room || r.rooms || [],
          systems: info.systems || info.system || r.systems || [],
          trade: info.trade || r.trade,
          date: info.date || r.date,
        },
        contractor: r.contractor || {
          name: r.contractorName,
          license: r.license,
          phone: r.phone,
          warranty: r.workmanshipWarranty,
        },
        cost: r.cost || {
          labor: r.labor,
          materials: r.materialsCost,
          total: r.total || r.totalCost,
          permitNo: r.permitNo || r.permit,
        },
        materials: r.materials || r.parts || r.items || [],
        inspection: r.inspection,
        warranty: r.warranty,
      } as HomeRecordData;
    });
  } catch (e) {
    console.error("Failed to parse home record JSON:", e);
    return [];
  }
}

/**
 * Before/after photos are named with a prefix: `before_`/`after_` (preferred)
 * or the legacy `old_`/`new_`, followed by a category and optional sequence:
 *   before_kitchen_1.jpg  ·  after_roof.jpg  ·  old_foundation_2.png
 */
function categorizeImage(filename: string): RecordImage | null {
  const lower = filename.toLowerCase();
  const prefixType = (p: string): "before" | "after" =>
    p === "old" || p === "before" ? "before" : "after";
  const format = (part: string) =>
    part
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // With sequence number.
  let match = lower.match(/^(old|new|before|after)_(.+?)_(\d+)\.([a-z]+)$/);
  if (match) {
    const [, prefix, categoryPart, sequenceStr] = match;
    return {
      type: prefixType(prefix),
      category: format(categoryPart),
      sequence: parseInt(sequenceStr),
      filename,
    };
  }

  // Without sequence number.
  match = lower.match(/^(old|new|before|after)_(.+)\.([a-z]+)$/);
  if (match) {
    const [, prefix, categoryPart] = match;
    return {
      type: prefixType(prefix),
      category: format(categoryPart),
      sequence: 1,
      filename,
    };
  }

  return null;
}

function categorizeDocument(filename: string): RecordDocument {
  const name = filename.toLowerCase();
  let type = "document";

  if (name.includes("receipt")) type = "receipt";
  else if (name.includes("permit")) type = "permit";
  else if (name.includes("warranty")) type = "warranty";
  else if (name.includes("invoice")) type = "invoice";
  else if (name.includes("estimate") || name.includes("quote"))
    type = "estimate";
  else if (name.includes("inspection")) type = "inspection";
  else if (name.includes("contract") || name.includes("agreement"))
    type = "contract";
  else if (name.includes("deed") || name.includes("title")) type = "deed";
  else if (name.includes("insurance") || name.includes("policy"))
    type = "insurance";
  else {
    const nameWithoutExt = filename.split(".")[0].toLowerCase();
    type = nameWithoutExt.replace(/[_-]/g, " ");
  }

  return {
    name: type.charAt(0).toUpperCase() + type.slice(1),
    type,
    filename,
  };
}

function matchBeforeAfterImages(images: RecordImage[]): Array<{
  category: string;
  sequence: number;
  before?: RecordImage;
  after?: RecordImage;
}> {
  const matches: {
    [key: string]: { before?: RecordImage; after?: RecordImage };
  } = {};

  images.forEach((image) => {
    const key = `${image.category}_${image.sequence}`;
    if (!matches[key]) matches[key] = {};
    matches[key][image.type] = image;
  });

  return Object.entries(matches).map(([key, match]) => {
    const [category, sequence] = key.split("_");
    return {
      category,
      sequence: parseInt(sequence),
      before: match.before,
      after: match.after,
    };
  });
}

export async function processHomeZipFile(
  zipData: ArrayBuffer
): Promise<ProcessedHomeData> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(zipData);

  let recordData: HomeRecordData[] = [];
  const images: RecordImage[] = [];
  const documents: RecordDocument[] = [];

  for (const [path, file] of Object.entries(contents.files)) {
    if (file.dir) continue;
    const fileName = path.toLowerCase();

    try {
      if (fileName.endsWith(".json")) {
        const content = await file.async("text");
        recordData = recordData.concat(parseHomeJSON(content));
      } else if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        const image = categorizeImage(path);
        if (image) {
          const content = await file.async("blob");
          image.url = URL.createObjectURL(content);
          images.push(image);
        }
      } else if (fileName.endsWith(".pdf")) {
        const document = categorizeDocument(path);
        const content = await file.async("arraybuffer");
        document.content = content;
        const blob = new Blob([content], { type: "application/pdf" });
        document.url = URL.createObjectURL(blob);
        documents.push(document);
      }
    } catch (error) {
      console.error(`Failed to process file ${path}:`, error);
    }
  }

  return {
    type: "home-record",
    recordData,
    images,
    documents,
    imageMatches: matchBeforeAfterImages(images),
  };
}

export interface IndividualFileInput {
  filename: string;
  data: ArrayBuffer;
}

export async function processIndividualHomeFiles(
  files: IndividualFileInput[]
): Promise<ProcessedHomeData> {
  let recordData: HomeRecordData[] = [];
  const images: RecordImage[] = [];
  const documents: RecordDocument[] = [];

  for (const file of files) {
    const fileName = file.filename.toLowerCase();

    try {
      if (fileName.endsWith(".json")) {
        const content = new TextDecoder().decode(file.data);
        recordData = recordData.concat(parseHomeJSON(content));
      } else if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        const image = categorizeImage(file.filename);
        if (image) {
          const blob = new Blob([file.data]);
          image.url = URL.createObjectURL(blob);
          images.push(image);
        }
      } else if (fileName.endsWith(".pdf")) {
        const document = categorizeDocument(file.filename);
        document.content = file.data;
        const blob = new Blob([file.data], { type: "application/pdf" });
        document.url = URL.createObjectURL(blob);
        documents.push(document);
      }
    } catch (error) {
      console.error(`Failed to process file ${file.filename}:`, error);
    }
  }

  return {
    type: "home-record",
    recordData,
    images,
    documents,
    imageMatches: matchBeforeAfterImages(images),
  };
}

/** Release object URLs created while processing a bundle. */
export function cleanupHomeData(data: ProcessedHomeData) {
  data.images.forEach((image) => {
    if (image.url) URL.revokeObjectURL(image.url);
  });
  data.documents.forEach((document) => {
    if (document.url) URL.revokeObjectURL(document.url);
  });
}
