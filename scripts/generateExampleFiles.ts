/**
 * Renders the example record catalogue into real PDF files, named by the
 * convention, laid out by section.
 *
 * The point is to have something to drive the demo with: a folder of files that
 * look like what a homeowner would actually drag in, rather than lorem ipsum.
 * Every page is stamped SAMPLE and carries a footer saying it is generated demo
 * content — these must never be mistakable for genuine records.
 *
 * Run with `npm run examples`. Output goes to `examples/` at the repo root.
 *
 * The filenames come from `buildRecordName`, the same helper the app uses, so
 * the convention cannot drift between the fixtures and the product.
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { jsPDF } from "jspdf";

import { STREAM_CATEGORIES } from "@/shared/constants/streams";
import {
  EXAMPLE_PROPERTY,
  EXAMPLE_RECORDS,
  ExampleRecord,
} from "@/shared/fixtures/home/exampleRecords";
import { buildRecordName } from "@/shared/utils/recordNaming";

const OUTPUT_DIR = join(process.cwd(), "examples");

const PAGE_MARGIN = 56;
const LINE_HEIGHT = 16;

/** "personal-vault" -> "5-personal-vault", so the folders sort in reading order. */
const sectionFolder = (record: ExampleRecord): string => {
  const category = STREAM_CATEGORIES[record.stream];
  return `${category.order}-${category.code}`;
};

const renderPdf = (record: ExampleRecord, filename: string): ArrayBuffer => {
  const category = STREAM_CATEGORIES[record.stream];
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = PAGE_MARGIN;

  // Watermark first, so the content sits over it.
  doc.setTextColor(232, 232, 232);
  doc.setFontSize(96);
  doc.setFont("helvetica", "bold");
  doc.text("SAMPLE", pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 30,
  });

  // Property and section.
  doc.setTextColor(90, 100, 114);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${EXAMPLE_PROPERTY.address}, ${EXAMPLE_PROPERTY.city}, ${EXAMPLE_PROPERTY.state} ${EXAMPLE_PROPERTY.zip}`,
    PAGE_MARGIN,
    y
  );
  y += 12;
  doc.text(
    `${category.label}${category.transfersOnSale ? "" : "  ·  PRIVATE — not transferred at sale"}`,
    PAGE_MARGIN,
    y
  );
  y += 22;

  doc.setDrawColor(210, 215, 222);
  doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
  y += 28;

  // Title.
  doc.setTextColor(25, 30, 36);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text(record.reason, PAGE_MARGIN, y);
  y += 20;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 100, 114);
  doc.text(
    `${record.type}  ·  ${new Date(record.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    PAGE_MARGIN,
    y
  );
  y += 12;

  if (record.event) {
    doc.text(`Linked event: ${record.event}`, PAGE_MARGIN, y);
    y += 12;
  }
  y += 18;

  // Body.
  doc.setTextColor(25, 30, 36);
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  for (const line of record.body) {
    for (const wrapped of doc.splitTextToSize(
      line,
      pageWidth - PAGE_MARGIN * 2
    ) as string[]) {
      doc.text(wrapped, PAGE_MARGIN, y);
      y += LINE_HEIGHT;
    }
  }

  // Footer.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(122, 132, 146);
  doc.text(
    "Generated sample content for the Filedgr Property Vault demo. Not a genuine record.",
    PAGE_MARGIN,
    pageHeight - PAGE_MARGIN + 14
  );
  doc.text(filename, PAGE_MARGIN, pageHeight - PAGE_MARGIN + 25);

  return doc.output("arraybuffer");
};

const main = async () => {
  await rm(OUTPUT_DIR, { recursive: true, force: true });

  const manifest: Array<{
    file: string;
    section: string;
    type: string;
    reason: string;
    date: string;
    event?: string;
  }> = [];

  for (const record of EXAMPLE_RECORDS) {
    const filename = buildRecordName({
      date: new Date(record.date),
      type: record.type,
      reason: record.reason,
      docName: record.docName,
      extension: record.extension,
    });

    const folder = sectionFolder(record);
    await mkdir(join(OUTPUT_DIR, folder), { recursive: true });
    await writeFile(
      join(OUTPUT_DIR, folder, filename),
      Buffer.from(renderPdf(record, filename))
    );

    manifest.push({
      file: `${folder}/${filename}`,
      section: STREAM_CATEGORIES[record.stream].label,
      type: record.type,
      reason: record.reason,
      date: record.date,
      ...(record.event ? { event: record.event } : {}),
    });
  }

  await writeFile(
    join(OUTPUT_DIR, "manifest.json"),
    `${JSON.stringify({ property: EXAMPLE_PROPERTY, records: manifest }, null, 2)}\n`
  );

  const events = [...new Set(manifest.flatMap((r) => (r.event ? [r.event] : [])))];
  const readme = [
    "# Example files",
    "",
    "Generated by `npm run examples` from `src/shared/fixtures/home/exampleRecords.ts`.",
    "Every file is synthetic demo content, watermarked SAMPLE. Do not treat any of",
    "it as a genuine record.",
    "",
    "Folders follow the five-section architecture, numbered in reading order.",
    "Filenames follow the convention `MM-DD-YY - Type - Reason - Doc Name`.",
    "",
    "## Sections",
    "",
    ...Object.values(STREAM_CATEGORIES)
      .sort((a, b) => a.order - b.order)
      .map((category) => {
        const count = manifest.filter(
          (r) => r.section === category.label
        ).length;
        const transfer = category.transfersOnSale
          ? "transfers at sale"
          : "**private — detached at sale**";
        return `- \`${category.order}-${category.code}\` — ${category.label} (${count} files, ${transfer})`;
      }),
    "",
    "## Linked events",
    "",
    "Records stay filed in their own section; the event is what draws them into a",
    "single chronological view. No document is duplicated to achieve it.",
    "",
    ...events.flatMap((event) => [
      `### ${event}`,
      "",
      ...manifest
        .filter((r) => r.event === event)
        .map((r) => `- ${r.section} — \`${r.file.split("/")[1]}\``),
      "",
    ]),
  ].join("\n");

  await writeFile(join(OUTPUT_DIR, "README.md"), `${readme}\n`);

  console.log(
    `Wrote ${manifest.length} example files to ${OUTPUT_DIR} across ${
      new Set(manifest.map((r) => r.section)).size
    } sections.`
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
