import { getStreamAttachments } from "@/shared/providers/api";
import { VaultDto, VaultStreamDto } from "@/shared/types/vault";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import { txUrl } from "@filedgr/web-core/explorer";
import { ledgerName } from "@/shared/utils/ledger";
import { formatStreamName } from "@/shared/utils/streamHelpers";
import jsPDF from "jspdf";

interface StreamAttachment {
  id: string;
  name?: string;
  description?: string | null;
  created_at?: string;
  status?: string;
  file_count?: number;
  size?: number;
  tx_hash?: string | null;
  ledger?: string;
  files?: Array<{
    filename?: string;
    mimetype?: string;
    hash?: string;
    size?: number;
    cid?: string;
  }>;
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtSize(bytes?: number): string {
  if (bytes == null || bytes === 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

async function fetchAllStreamAttachments(
  streams: VaultStreamDto[]
): Promise<Map<string, StreamAttachment[]>> {
  const result = new Map<string, StreamAttachment[]>();
  const promises = streams
    .filter((s) => s.asset_code)
    .map(async (stream) => {
      try {
        const response = await getStreamAttachments(stream.asset_code!, 1, 100);
        result.set(stream.id, response.data?.content || []);
      } catch {
        result.set(stream.id, []);
      }
    });
  await Promise.all(promises);
  return result;
}

export async function generateVaultProofPdf(vault: VaultDto) {
  // Fetch all stream attachments first
  const streamAttachments = vault.streams
    ? await fetchAllStreamAttachments(vault.streams)
    : new Map<string, StreamAttachment[]>();

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Helper: draw a labeled row
  const drawRow = (label: string, value: string, labelWidth = 50) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);
    doc.text(label, margin + 6, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 24, 39);
    const lines = doc.splitTextToSize(value, contentWidth - labelWidth - 12);
    doc.text(lines, margin + labelWidth, y);
    y += Math.max(lines.length * 4.5, 7);
  };

  // Helper: section title
  const sectionTitle = (title: string) => {
    checkPageBreak(16);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(title, margin, y);
    y += 7;
  };

  // Helper: draw a divider line
  const divider = () => {
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;
  };

  // ========================================
  // PAGE 1: HEADER
  // ========================================
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageWidth, 50, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Home Record History Proof", margin, 22);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text(vault.name, margin, 33);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated on ${fmtDate(new Date().toISOString())}  |  Powered by Filedgr`,
    margin,
    43
  );

  y = 60;
  doc.setTextColor(0, 0, 0);

  // ========================================
  // HOME OVERVIEW
  // ========================================
  sectionTitle("Home Overview");

  doc.setFillColor(249, 250, 251);
  const overviewRows: [string, string][] = [
    ["Name", vault.name],
  ];
  if (vault.description) overviewRows.push(["Description", vault.description]);
  overviewRows.push([
    "Status",
    vault.status ? getStatusConfig(vault.status).label : "",
  ]);
  if (vault.created_at) overviewRows.push(["Registered", fmtDate(vault.created_at)]);
  if (vault.ledger) {
    overviewRows.push(["Network", ledgerName(vault.ledger)]);
  }
  if (vault.streams) overviewRows.push(["Record Streams", `${vault.streams.length}`]);

  // Count total records across all streams
  let totalRecords = 0;
  streamAttachments.forEach((attachments) => {
    totalRecords += attachments.length;
  });
  overviewRows.push(["Total Home Records", `${totalRecords}`]);

  const overviewHeight = overviewRows.length * 7 + 6;
  doc.roundedRect(margin, y, contentWidth, overviewHeight, 2, 2, "F");
  y += 5;
  for (const [label, value] of overviewRows) {
    drawRow(label, value);
  }
  y += 4;

  // ========================================
  // BLOCKCHAIN VERIFICATION (Vault level)
  // ========================================
  if (vault.tx_hash) {
    checkPageBreak(40);
    sectionTitle("Blockchain Verification");

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, y, contentWidth, 30, 3, 3, "FD");
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 128, 61);
    doc.text("Home Record Verified on Blockchain", margin + 6, y);
    y += 6;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Network: ${ledgerName(vault.ledger) || "Unknown"}`,
      margin + 6,
      y
    );
    y += 5;

    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(`TX: ${vault.tx_hash}`, margin + 6, y);

    if (vault.tx_hash) {
      y += 5;
      const verifyUrl = txUrl(vault.tx_hash, vault.ledger);
      doc.setTextColor(37, 99, 235);
      doc.textWithLink("Verify this transaction online", margin + 6, y, {
        url: verifyUrl,
      });
    }

    y += 12;
    doc.setTextColor(0, 0, 0);
  }

  // ========================================
  // RECORD STREAMS & RECORDS
  // ========================================
  if (vault.streams && vault.streams.length > 0) {
    sectionTitle("Complete Home Record History");
    y += 2;

    for (const stream of vault.streams) {
      checkPageBreak(30);

      const streamName = formatStreamName(stream);

      const attachments = streamAttachments.get(stream.id) || [];

      // Stream header bar
      doc.setFillColor(239, 246, 255); // blue-50
      doc.setDrawColor(191, 219, 254); // blue-200
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");
      y += 9;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 64, 175); // blue-800
      doc.text(streamName, margin + 6, y);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      const streamMeta: string[] = [];
      streamMeta.push(`${attachments.length} record${attachments.length !== 1 ? "s" : ""}`);
      if (stream.status) streamMeta.push(getStatusConfig(stream.status).label);
      if (stream.tx_hash) streamMeta.push("Blockchain verified");
      doc.text(streamMeta.join("  |  "), margin + 6 + doc.getTextWidth(streamName) + 8, y);

      y += 9;

      if (stream.description) {
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.text(stream.description, margin + 6, y);
        y += 6;
      }

      // Stream blockchain verification
      if (stream.tx_hash) {
        checkPageBreak(12);
        doc.setFontSize(7);
        doc.setTextColor(21, 128, 61);
        doc.text(`Stream TX: ${stream.tx_hash}`, margin + 6, y);
        if (stream.tx_hash) {
          const verifyUrl = txUrl(
            stream.tx_hash,
            stream.ledger || vault.ledger
          );
          doc.setTextColor(37, 99, 235);
          doc.textWithLink("  [verify]", margin + 6 + doc.getTextWidth(`Stream TX: ${stream.tx_hash}`), y, {
            url: verifyUrl,
          });
        }
        y += 6;
      }

      // Attachments for this stream
      if (attachments.length === 0) {
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text("No home records uploaded yet", margin + 6, y);
        y += 8;
      } else {
        for (const att of attachments) {
          checkPageBreak(35);

          // Attachment card
          doc.setFillColor(249, 250, 251);
          doc.setDrawColor(229, 231, 235);

          // Calculate card height based on content
          const hasFiles = att.files && att.files.length > 0;
          const hasTx = !!att.tx_hash;
          let cardHeight = 16; // base: name + date line
          if (att.description) cardHeight += 5;
          if (hasTx) cardHeight += 6;
          if (hasFiles) cardHeight += 5 + (att.files!.length * 5) + 2;

          checkPageBreak(cardHeight + 4);
          doc.roundedRect(margin + 4, y, contentWidth - 8, cardHeight, 2, 2, "FD");
          y += 6;

          // Attachment name
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(17, 24, 39);
          doc.text(att.name || "Home Record", margin + 10, y);

          // Status badge text
          if (att.status) {
            const statusText = getStatusConfig(att.status).label;
            const nameWidth = doc.getTextWidth(att.name || "Home Record");
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(21, 128, 61);
            doc.text(`[${statusText}]`, margin + 10 + nameWidth + 4, y);
          }
          y += 5;

          // Date, file count, size
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(107, 114, 128);
          const metaParts: string[] = [];
          if (att.created_at) metaParts.push(fmtDate(att.created_at));
          if (att.file_count != null) metaParts.push(`${att.file_count} file${att.file_count !== 1 ? "s" : ""}`);
          if (att.size) metaParts.push(fmtSize(att.size));
          doc.text(metaParts.join("  |  "), margin + 10, y);
          y += 5;

          // Description
          if (att.description) {
            doc.setFontSize(7);
            doc.setTextColor(75, 85, 99);
            const descLines = doc.splitTextToSize(att.description, contentWidth - 24);
            doc.text(descLines, margin + 10, y);
            y += descLines.length * 4 + 1;
          }

          // Attachment blockchain verification
          if (att.tx_hash) {
            doc.setFontSize(6.5);
            doc.setTextColor(21, 128, 61);
            doc.text(`TX: ${att.tx_hash}`, margin + 10, y);
            y += 5;
          }

          // Files list
          if (hasFiles) {
            doc.setFontSize(6.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(107, 114, 128);
            doc.text("Files:", margin + 10, y);
            y += 4;

            doc.setFont("helvetica", "normal");
            for (const file of att.files!) {
              const fname = file.filename || "unknown";
              const displayName = fname.length > 40 ? fname.slice(0, 37) + "..." : fname;
              doc.setTextColor(55, 65, 81);
              doc.text(`  ${displayName}`, margin + 10, y);
              doc.setTextColor(156, 163, 175);
              const fileMeta: string[] = [];
              if (file.mimetype) fileMeta.push(file.mimetype);
              if (file.size) fileMeta.push(fmtSize(file.size));
              if (file.hash) fileMeta.push(`hash: ${file.hash.slice(0, 12)}...`);
              if (fileMeta.length > 0) {
                doc.text(fileMeta.join(" | "), margin + 10 + doc.getTextWidth(`  ${displayName}`) + 3, y);
              }
              y += 5;
            }
          }

          y += 4;
        }
      }

      y += 2;
      divider();
      y += 2;
    }
  }

  // ========================================
  // VAULT CONFIGURATION
  // ========================================
  if (vault.config) {
    checkPageBreak(30);
    sectionTitle("Record Configuration");

    doc.setFillColor(249, 250, 251);
    const configRows: [string, string][] = [];
    if (vault.config.is_permissioned != null)
      configRows.push(["Access Control", vault.config.is_permissioned ? "Permissioned" : "Public"]);
    if (vault.config.is_searchable != null)
      configRows.push(["Searchable", vault.config.is_searchable ? "Yes" : "No"]);
    if (vault.config.is_ai_ready != null)
      configRows.push(["AI Processing", vault.config.is_ai_ready ? "Enabled" : "Disabled"]);
    if (vault.vault_permission_type)
      configRows.push(["Permission Type", vault.vault_permission_type.replace(/_/g, " ")]);

    if (configRows.length > 0) {
      const configHeight = configRows.length * 7 + 6;
      doc.roundedRect(margin, y, contentWidth, configHeight, 2, 2, "F");
      y += 5;
      for (const [label, value] of configRows) {
        drawRow(label, value);
      }
      y += 4;
    }
  }

  // ========================================
  // CONTENT IDENTIFIERS
  // ========================================
  const hasCids = vault.cid || vault.image_cid || vault.metadata_cid;
  if (hasCids) {
    checkPageBreak(30);
    sectionTitle("Content Identifiers (IPFS)");

    doc.setFillColor(249, 250, 251);
    const cidRows: [string, string][] = [];
    if (vault.cid) cidRows.push(["Vault CID", vault.cid]);
    if (vault.image_cid) cidRows.push(["Image CID", vault.image_cid]);
    if (vault.metadata_cid) cidRows.push(["Metadata CID", vault.metadata_cid]);

    const cidHeight = cidRows.length * 7 + 6;
    doc.roundedRect(margin, y, contentWidth, cidHeight, 2, 2, "F");
    y += 5;
    for (const [label, value] of cidRows) {
      drawRow(label, value, 40);
    }
    y += 4;
  }

  // ========================================
  // DISCLAIMER
  // ========================================
  checkPageBreak(25);
  y += 4;
  doc.setFillColor(254, 252, 232); // yellow-50
  doc.setDrawColor(253, 224, 71); // yellow-300
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "FD");
  y += 7;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(113, 63, 18); // yellow-800
  doc.text("Disclaimer", margin + 6, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(133, 77, 14);
  doc.text(
    "This document is generated from blockchain-verified records. All transactions can be independently verified on the respective blockchain explorers.",
    margin + 6,
    y,
    { maxWidth: contentWidth - 12 }
  );

  // ========================================
  // FOOTER on every page
  // ========================================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 10;
    doc.setFillColor(24, 24, 27);
    doc.rect(0, footerY - 5, pageWidth, 15, "F");
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Home Record History Proof  —  ${vault.name}  —  Filedgr`,
      margin,
      footerY
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 22,
      footerY
    );
  }

  // Save
  const fileName = `home-proof-${vault.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  doc.save(fileName);
}
