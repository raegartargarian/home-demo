/**
 * Generates the demo's media set — the half of the example catalogue that
 * `generateExampleFiles.ts` can't produce, because it isn't paper.
 *
 * Why this exists: the stream-detail attachment view renders whatever web-core
 * can render (image, video, audio, 3D, docx, xlsx, zip, csv, json, markdown),
 * but every example file in the repo was a jsPDF page. A demo that uploads
 * twenty near-identical PDFs proves nothing about the preview layer, and the
 * two records literally named "Photo — Before demolition" were text documents.
 *
 * Everything here is generated from geometry or from ffmpeg/sips, so there is
 * no licensing question and no stock-photo tell. Nothing is a photograph, and
 * every asset says so on its face.
 *
 * Run with `npm run examples:media`. Output:
 *   src/assets/drawings/*.svg   authored drawings, consumed by the app
 *   examples/6-media/*          the upload set, one file per renderer
 *
 * Requires macOS `qlmanage` + `sips` (SVG rasterisation, HEIC) and `ffmpeg`
 * (the walkthrough clip). Each is checked before use and skipped with a warning
 * rather than failing the run.
 */
import { execFile } from "node:child_process";
import {
  appendFile,
  copyFile,
  mkdir,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

import JSZip from "jszip";

import {
  explodedAxonometric,
  floorPlan,
  kitchenAfter,
  kitchenBefore,
  roofStormDamage,
} from "./drawings.mjs";

const run = promisify(execFile);

const ROOT = process.cwd();
const DRAWINGS_DIR = join(ROOT, "src/assets/drawings");
const MEDIA_DIR = join(ROOT, "examples/6-media");
const TMP_DIR = join(ROOT, "node_modules/.cache/example-media");

const has = async (bin) => {
  try {
    await run("which", [bin]);
    return true;
  } catch {
    return false;
  }
};

const log = (message) => console.log(`  ${message}`);

// ---------------------------------------------------------------------------
// Drawings → SVG → PNG / JPEG
// ---------------------------------------------------------------------------

const DRAWINGS = [
  { name: "floor-plan-a101", build: floorPlan, width: 1800 },
  { name: "exploded-axonometric", build: explodedAxonometric, width: 2000 },
  { name: "kitchen-before", build: kitchenBefore, width: 1800 },
  { name: "kitchen-after", build: kitchenAfter, width: 1800 },
  { name: "roof-storm-damage", build: roofStormDamage, width: 1800 },
];

/**
 * QuickLook is the only SVG rasteriser guaranteed to be present on a Mac. It
 * writes `<name>.svg.png` next to the requested output, so the caller renames.
 */
async function rasterise(svgPath, outPath, width) {
  await run("qlmanage", ["-t", "-s", String(width), "-o", TMP_DIR, svgPath]);
  const produced = join(TMP_DIR, `${svgPath.split("/").pop()}.png`);
  if (!existsSync(produced)) throw new Error(`qlmanage produced nothing for ${svgPath}`);
  await copyFile(produced, outPath);
}

async function buildDrawings() {
  const rasteriser = (await has("qlmanage")) && (await has("sips"));
  const raster = {};

  for (const drawing of DRAWINGS) {
    const svgPath = join(DRAWINGS_DIR, `${drawing.name}.svg`);
    await writeFile(svgPath, drawing.build(), "utf8");
    log(`svg    ${drawing.name}.svg`);

    if (!rasteriser) continue;

    const pngPath = join(MEDIA_DIR, `${drawing.name}.png`);
    await rasterise(svgPath, pngPath, drawing.width);
    raster[drawing.name] = pngPath;
    log(`png    ${drawing.name}.png`);
  }

  if (!rasteriser) {
    console.warn("  ! qlmanage/sips unavailable — skipping raster, video and HEIC");
    return raster;
  }

  // A JPEG as well as PNGs: phones produce JPEG, and the thumbnail path treats
  // the two differently enough to be worth exercising.
  const jpeg = join(MEDIA_DIR, "kitchen-after.jpg");
  await run("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", raster["kitchen-after"], "--out", jpeg]);
  log("jpeg   kitchen-after.jpg");

  // HEIC: what an iPhone actually uploads, and the one image format that needs
  // web-core's decode fallback rather than a plain <img>.
  try {
    const heic = join(MEDIA_DIR, "kitchen-after.heic");
    await run("sips", ["-s", "format", "heic", raster["kitchen-after"], "--out", heic]);
    log("heic   kitchen-after.heic");
  } catch {
    console.warn("  ! sips could not write HEIC on this machine — skipped");
  }

  return raster;
}

// ---------------------------------------------------------------------------
// Video — a slow pan across the finished kitchen
// ---------------------------------------------------------------------------

async function buildVideo(raster) {
  if (!(await has("ffmpeg")) || !raster["kitchen-after"]) {
    console.warn("  ! ffmpeg unavailable — skipping walkthrough clip");
    return;
  }
  const out = join(MEDIA_DIR, "kitchen-walkthrough.mp4");
  // A 10s 1080p pan across the still.
  //
  // Deliberately `crop` rather than `zoompan`: zoompan's `d` is frames-per-
  // input-frame, so pairing it with `-loop 1` multiplies the frame count into
  // the tens of thousands and writes a file measured in hundreds of megabytes.
  // Cropping a window whose x moves with `t` gives the same effect in one pass.
  await run("ffmpeg", [
    "-y",
    "-loglevel", "error",
    "-loop", "1",
    "-framerate", "30",
    "-i", raster["kitchen-after"],
    "-t", "10",
    "-vf",
    "scale=2560:-2,crop=1920:1080:x='(iw-1920)*(0.5-0.5*cos(2*PI*t/20))':y='(ih-1080)/2',format=yuv420p",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "23",
    "-r", "30",
    "-movflags", "+faststart",
    out,
  ]);
  log("mp4    kitchen-walkthrough.mp4");
}

// ---------------------------------------------------------------------------
// 3D — the house massing, as binary glTF
// ---------------------------------------------------------------------------

/**
 * A hand-built GLB. The house is a box with a gable roof, which is enough to
 * prove the 3D renderer resolves, loads and orbits — and it is the same massing
 * as the axonometric, so the demo tells one story across three media.
 */
function buildGlb() {
  const W = 4.4;
  const D = 3.8;
  const H = 2.6;
  const RIDGE = 4.0;

  // Positions, as flat triangles so normals stay per-face and the model reads
  // as architecture rather than a blob.
  const tri = [];
  const push = (a, b, c) => tri.push(...a, ...b, ...c);
  const quad = (a, b, c, d) => {
    push(a, b, c);
    push(a, c, d);
  };

  const x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;
  // Walls.
  quad([x0, 0, z1], [x1, 0, z1], [x1, H, z1], [x0, H, z1]);
  quad([x1, 0, z0], [x0, 0, z0], [x0, H, z0], [x1, H, z0]);
  quad([x0, 0, z0], [x0, 0, z1], [x0, H, z1], [x0, H, z0]);
  quad([x1, 0, z1], [x1, 0, z0], [x1, H, z0], [x1, H, z1]);
  // Floor.
  quad([x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]);
  // Gable ends.
  push([x0, H, z1], [x1, H, z1], [0, RIDGE, z1]);
  push([x1, H, z0], [x0, H, z0], [0, RIDGE, z0]);
  // Roof planes, oversailing the walls slightly so there is an eave.
  const e = 0.18;
  quad([x0 - e, H, z1 + e], [0, RIDGE, z1 + e], [0, RIDGE, z0 - e], [x0 - e, H, z0 - e]);
  quad([0, RIDGE, z1 + e], [x1 + e, H, z1 + e], [x1 + e, H, z0 - e], [0, RIDGE, z0 - e]);

  const positions = new Float32Array(tri);
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], positions[i + axis]);
      max[axis] = Math.max(max[axis], positions[i + axis]);
    }
  }

  const bin = Buffer.from(positions.buffer);
  const padTo4 = (buffer) => {
    const pad = (4 - (buffer.length % 4)) % 4;
    return pad ? Buffer.concat([buffer, Buffer.alloc(pad, 0)]) : buffer;
  };
  const binChunk = padTo4(bin);

  const gltf = {
    asset: { version: "2.0", generator: "home-demo generateExampleMedia" },
    scene: 0,
    scenes: [{ nodes: [0], name: "4412 Maple Ridge Drive" }],
    nodes: [{ mesh: 0, name: "House massing" }],
    meshes: [
      {
        name: "Massing",
        primitives: [{ attributes: { POSITION: 0 }, material: 0 }],
      },
    ],
    materials: [
      {
        name: "Paper",
        pbrMetallicRoughness: {
          baseColorFactor: [0.96, 0.95, 0.93, 1],
          metallicFactor: 0,
          roughnessFactor: 0.85,
        },
        doubleSided: true,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: positions.length / 3,
        type: "VEC3",
        min,
        max,
      },
    ],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: bin.length, target: 34962 }],
    buffers: [{ byteLength: binChunk.length }],
  };

  const jsonChunk = padTo4(Buffer.from(JSON.stringify(gltf), "utf8"));
  const header = Buffer.alloc(12);
  header.write("glTF", 0, "ascii");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.write("JSON", 4, "ascii");

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.write("BIN\0", 4, "ascii");

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

// ---------------------------------------------------------------------------
// Office documents — real OOXML, built as zips
// ---------------------------------------------------------------------------

const QUOTE_PARAGRAPHS = [
  ["Hill Country Kitchens", "title"],
  ["Renovation quote · 4412 Maple Ridge Drive, Austin TX 78704", "sub"],
  ["", "body"],
  ["Scope of work", "heading"],
  ["Full kitchen remodel: remove existing cabinetry, counters and flooring; install new base and wall cabinets, quartz counters, island with seating for three, and engineered oak flooring throughout.", "body"],
  ["", "body"],
  ["Schedule", "heading"],
  ["Demolition begins 4 March 2024. Final walkthrough 26 June 2024, subject to counter lead time.", "body"],
  ["", "body"],
  ["Pricing", "heading"],
  ["Labour $18,400 · Materials $23,650 · Permit $310. Total $42,360, fixed price, 30% on signature.", "body"],
  ["", "body"],
  ["GENERATED SAMPLE — demo content, not a genuine quotation.", "note"],
];

async function buildDocx() {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  );
  zip.folder("_rels").file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
  );

  const style = { title: "Title", sub: "Subtitle", heading: "Heading1", body: "", note: "" };
  const body = QUOTE_PARAGRAPHS.map(([content, kind]) => {
    const pStyle = style[kind] ? `<w:pPr><w:pStyle w:val="${style[kind]}"/></w:pPr>` : "";
    const escaped = content.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    return `<w:p>${pStyle}<w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
  }).join("");

  zip.folder("word").file(
    "document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`
  );

  return zip.generateAsync({ type: "nodebuffer" });
}

const COST_ROWS = [
  ["Item", "Trade", "Date", "Cost"],
  ["Demolition & haul-away", "General", "2024-03-04", 2100],
  ["Base & wall cabinets", "Millwork", "2024-04-12", 14800],
  ["Quartz counters", "Stone", "2024-05-20", 6900],
  ["Engineered oak flooring", "Flooring", "2024-05-28", 4350],
  ["Island & seating", "Millwork", "2024-06-06", 3800],
  ["Electrical & pendants", "Electrical", "2024-06-14", 2600],
  ["Plumbing & sink", "Plumbing", "2024-06-18", 1900],
  ["Paint & finish", "Finish", "2024-06-24", 1600],
  ["Permit", "City of Austin", "2024-02-28", 310],
];

async function buildXlsx() {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`
  );
  zip.folder("_rels").file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
  );
  const xl = zip.folder("xl");
  xl.file(
    "workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Kitchen Remodel" sheetId="1" r:id="rId1"/></sheets></workbook>`
  );
  xl.folder("_rels").file(
    "workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`
  );

  const col = (index) => String.fromCharCode(65 + index);
  const rows = COST_ROWS.map((row, rowIndex) => {
    const cells = row
      .map((value, colIndex) => {
        const ref = `${col(colIndex)}${rowIndex + 1}`;
        return typeof value === "number"
          ? `<c r="${ref}"><v>${value}</v></c>`
          : `<c r="${ref}" t="inlineStr"><is><t>${String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</t></is></c>`;
      })
      .join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");

  xl.folder("worksheets").file(
    "sheet1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`
  );

  return zip.generateAsync({ type: "nodebuffer" });
}

// ---------------------------------------------------------------------------
// The rest of the long tail
// ---------------------------------------------------------------------------

const MAINTENANCE_CSV = `date,system,work,contractor,cost
2019-07-22,HVAC,Trane XR14 installation,Lone Star Air,8400
2022-04-08,Solar,14-panel array installation,Freedom Solar,21600
2024-06-28,Kitchen,Full remodel — final invoice,Hill Country Kitchens,42360
2025-10-07,Flooring,New carpeting — bedrooms 2 & 3,Home Depot,3180
2026-03-12,HVAC,Annual service — coil clean, filter,Lone Star Air,240
2026-05-30,Roof,Full replacement after storm,Summit Roofing,28750
`;

const RECORD_JSON = {
  property: {
    address: "4412 Maple Ridge Drive",
    city: "Austin",
    state: "TX",
    zip: "78704",
    yearBuilt: 1998,
    sqft: 2640,
  },
  record: {
    name: "Kitchen Remodel",
    type: "renovation",
    collection: "Kitchen Remodel – 2024",
    startedAt: "2024-03-04",
    completedAt: "2024-06-26",
    rooms: ["Kitchen", "Dining"],
    cost: { labor: 18400, materials: 23650, permitNo: "2024-KR-88412", total: 42360 },
    contractor: {
      name: "Hill Country Kitchens",
      license: "TX-RC-114872",
      warranty: "2 years workmanship",
    },
  },
  note: "GENERATED SAMPLE — demo content, not a genuine record.",
};

const README_MD = `# Kitchen Remodel — 2024

**4412 Maple Ridge Drive**, Austin TX 78704

A full kitchen remodel, documented from teardown to final walkthrough.

## What's in this record

| File | What it is |
| --- | --- |
| \`kitchen-before.png\` | The wall before demolition, 4 March 2024 |
| \`kitchen-after.png\` | The same wall at final walkthrough, 26 June 2024 |
| \`kitchen-walkthrough.mp4\` | Slow pan across the finished kitchen |
| \`house-massing.glb\` | The property massing, in 3D |
| \`contractor-quote.docx\` | Hill Country Kitchens, fixed-price quote |
| \`renovation-costs.xlsx\` | Line-item costs by trade |
| \`maintenance-log.csv\` | Every system service on the property |

## Why it matters

Every layer of this house is on the record — foundation, floor, systems, roof —
and all of it transfers at sale.

> GENERATED SAMPLE — demo content, not a genuine record.
`;

async function buildReceiptsZip() {
  const zip = new JSZip();
  zip.file("README.md", README_MD);
  zip.file("maintenance-log.csv", MAINTENANCE_CSV);
  zip.file("kitchen_remodel.record.json", JSON.stringify(RECORD_JSON, null, 2));
  zip.file(
    "receipts/2024-06-28-hill-country-kitchens.txt",
    "Hill Country Kitchens\nFinal invoice · 28 June 2024\nTotal $42,360.00 — paid in full\n\nGENERATED SAMPLE\n"
  );
  zip.file(
    "receipts/2024-02-28-city-of-austin-permit.txt",
    "City of Austin · Development Services\nPermit 2024-KR-88412 · $310.00\n\nGENERATED SAMPLE\n"
  );
  return zip.generateAsync({ type: "nodebuffer" });
}

/**
 * `generateExampleFiles.ts` owns `examples/README.md` and rewrites it on every
 * run, so the media set documents itself by appending — this script runs
 * second. Anything written here would be lost if the order were reversed.
 */
const MEDIA_README_SECTION = `
## The media set — \`6-media\`

Not a section of the taxonomy: this folder exists to drive the upload demo.
Every file exercises a different \`@filedgr/web-core\` preview renderer, so
uploading the folder proves the whole preview layer rather than the PDF path
twenty times over.

| File | Renderer it exercises |
| --- | --- |
| \`kitchen-before.png\`, \`kitchen-after.png\`, \`roof-storm-damage.png\`, \`exploded-axonometric.png\`, \`floor-plan-a101.png\` | image |
| \`kitchen-after.jpg\` | image (JPEG) |
| \`kitchen-after.heic\` | image, via web-core's HEIC decode fallback |
| \`floor-plan-a101.svg\` | image (vector) |
| \`kitchen-walkthrough.mp4\` | video |
| \`house-massing.glb\` | 3D (three.js) |
| \`contractor-quote.docx\` | document (mammoth) |
| \`renovation-costs.xlsx\` | spreadsheet (SheetJS) |
| \`receipts-and-notes.zip\` | zip listing |
| \`maintenance-log.csv\` | text / CSV |
| \`kitchen_remodel.record.json\` | JSON |
| \`README.md\` | markdown |

Nothing here is a photograph. The drawings are generated from geometry in
\`scripts/drawings.mjs\` — see \`docs/design-direction.md\` §5C for why drawings
rather than stock photography — and the raster, video and HEIC variants are
derived from them with \`qlmanage\`, \`sips\` and \`ffmpeg\`. When those tools are
missing the generator skips those files with a warning rather than failing.

The drawings are also written to \`src/assets/drawings/\` as SVG, where the app
consumes them for the hero and the before/after carousel.
`;

// ---------------------------------------------------------------------------

async function main() {
  await mkdir(DRAWINGS_DIR, { recursive: true });
  await rm(MEDIA_DIR, { recursive: true, force: true });
  await mkdir(MEDIA_DIR, { recursive: true });
  await rm(TMP_DIR, { recursive: true, force: true });
  await mkdir(TMP_DIR, { recursive: true });

  console.log("Drawings");
  const raster = await buildDrawings();

  console.log("Video");
  await buildVideo(raster);

  console.log("Everything else");
  await writeFile(join(MEDIA_DIR, "house-massing.glb"), buildGlb());
  log("glb    house-massing.glb");

  await writeFile(join(MEDIA_DIR, "contractor-quote.docx"), await buildDocx());
  log("docx   contractor-quote.docx");

  await writeFile(join(MEDIA_DIR, "renovation-costs.xlsx"), await buildXlsx());
  log("xlsx   renovation-costs.xlsx");

  await writeFile(join(MEDIA_DIR, "receipts-and-notes.zip"), await buildReceiptsZip());
  log("zip    receipts-and-notes.zip");

  await writeFile(join(MEDIA_DIR, "maintenance-log.csv"), MAINTENANCE_CSV, "utf8");
  log("csv    maintenance-log.csv");

  await writeFile(
    join(MEDIA_DIR, "kitchen_remodel.record.json"),
    JSON.stringify(RECORD_JSON, null, 2),
    "utf8"
  );
  log("json   kitchen_remodel.record.json");

  await writeFile(join(MEDIA_DIR, "README.md"), README_MD, "utf8");
  log("md     README.md");

  // The floor plan travels as an SVG too — it is the one asset the app itself
  // consumes, and vector is what makes the sketch→photo wipe stay crisp.
  await copyFile(
    join(DRAWINGS_DIR, "floor-plan-a101.svg"),
    join(MEDIA_DIR, "floor-plan-a101.svg")
  );
  log("svg    floor-plan-a101.svg");

  await appendFile(join(ROOT, "examples/README.md"), MEDIA_README_SECTION, "utf8");
  log("md     README.md (appended media section)");

  await rm(TMP_DIR, { recursive: true, force: true });

  const written = (await readdir(MEDIA_DIR)).sort();
  console.log(`\n${written.length} files in examples/6-media:`);
  for (const file of written) console.log(`  ${file}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
