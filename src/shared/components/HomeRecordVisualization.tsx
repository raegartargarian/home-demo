import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toPreviewSource, useBlobResolver } from "@/shared/hooks/usePreview";
import {
  FilePreview,
  type PreviewSource,
} from "@filedgr/web-core/preview";
import { ProcessedHomeData } from "@/shared/utils/zipHandler";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Download,
  FileText,
  Hammer,
  Hash,
  Home,
  Image as ImageIcon,
  Maximize2,
  Package,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

interface HomeRecordVisualizationProps {
  data: ProcessedHomeData;
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const RECORD_TYPE_LABELS: Record<string, string> = {
  build_phase: "Build Phase",
  renovation: "Renovation",
  repair: "Repair",
  service: "Service",
  purchase: "Purchase",
  document: "Document",
};

const money = (n?: number) =>
  n == null ? null : `$${n.toLocaleString("en-US")}`;

type RecordDocument = ProcessedHomeData["documents"][number];

type SelectedDoc = { source: PreviewSource; name: string; url: string };

/**
 * One document from the record bundle.
 *
 * This is a component rather than a block inside the parent's `.map()` because
 * web-core's resolve effect keys on the identity of both `source` and
 * `resolver`. Built inline in a map they are new objects on every render, and
 * the document is re-read from the blob each time the parent re-renders.
 */
const DocumentCard = ({
  doc,
  onExpand,
}: {
  doc: RecordDocument;
  onExpand: (selected: SelectedDoc) => void;
}) => {
  // Files come out of the record zip already materialised as blob URLs, so the
  // resolver short-circuits transport and web-core dispatches on filename/mime
  // like any other source.
  const source = useMemo(
    () => toPreviewSource({ cid: doc.url, filename: doc.filename || doc.name }, doc.name),
    [doc.url, doc.filename, doc.name]
  );
  const resolver = useBlobResolver(doc.url);

  return (
    <motion.div variants={staggerItem}>
      <Card className="bg-surface-raised border border-line overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b border-line px-4 py-3 flex items-center justify-between">
            <h4 className="font-medium text-ink text-sm capitalize flex items-center gap-2">
              <FileText className="w-4 h-4 text-ink-subtle" />
              {doc.name}
            </h4>
            <div className="flex items-center gap-3">
              {doc.url && (
                <button
                  type="button"
                  onClick={() =>
                    onExpand({ source, name: doc.name, url: doc.url! })
                  }
                  className="inline-flex items-center gap-1 text-ink-muted hover:text-ink text-xs font-medium"
                >
                  <Maximize2 className="w-3 h-3" />
                  Full screen
                </button>
              )}
              <a
                href={doc.url}
                download={doc.filename}
                className="inline-flex items-center gap-1 text-ink-muted hover:text-ink text-xs font-medium"
              >
                <Download className="w-3 h-3" />
                Download
              </a>
            </div>
          </div>
          <div className="relative bg-surface-sunken h-80 overflow-hidden">
            {doc.url && (
              <FilePreview
                source={source}
                resolver={resolver}
                className="w-full h-full"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/** The expanded view. Its own component so the resolver is memoised here too,
 *  rather than rebuilt on every parent render while the modal is open. */
const DocumentLightbox = ({
  selected,
  onClose,
}: {
  selected: SelectedDoc;
  onClose: () => void;
}) => {
  const resolver = useBlobResolver(selected.url);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative flex flex-col w-full h-full max-w-6xl bg-surface-raised rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line shrink-0">
          <h3 className="text-sm font-medium text-ink capitalize flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-ink-subtle shrink-0" />
            <span className="truncate">{selected.name}</span>
          </h3>
          <div className="flex items-center gap-4 shrink-0">
            <a
              href={selected.url}
              download={selected.source.filename}
              className="inline-flex items-center gap-1 text-ink-muted hover:text-ink text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-ink-subtle hover:text-ink transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Same dispatch as the inline tile, more room. */}
        <div className="flex-1 min-h-0 bg-surface-sunken">
          <FilePreview
            source={selected.source}
            resolver={resolver}
            className="w-full h-full"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

const HomeRecordVisualization: React.FC<HomeRecordVisualizationProps> = ({
  data,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<SelectedDoc | null>(null);

  if (
    !data ||
    (!data.recordData?.length &&
      !data.images?.length &&
      !data.documents?.length)
  ) {
    return (
      <div className="text-center p-8">
        <p className="text-ink-muted">No record data available</p>
      </div>
    );
  }

  const record = data.recordData[0];
  const info = record?.recordInfo;
  const tags = [...(info?.rooms ?? []), ...(info?.systems ?? [])];

  // Compute which tabs have data
  const availableTabs: Array<{
    value: string;
    label: string;
    icon: React.ElementType;
  }> = [];
  if (data.imageMatches && data.imageMatches.length > 0) {
    availableTabs.push({ value: "images", label: "Photos", icon: ImageIcon });
  }
  if (record) {
    availableTabs.push({ value: "details", label: "Details", icon: FileText });
  }
  if (data.documents && data.documents.length > 0) {
    availableTabs.push({ value: "documents", label: "Docs", icon: FileText });
  }
  if (record?.materials && record.materials.length > 0) {
    availableTabs.push({ value: "materials", label: "Materials", icon: Package });
  }
  const defaultTab = availableTabs[0]?.value ?? "details";
  const gridCols =
    availableTabs.length === 1
      ? "grid-cols-1"
      : availableTabs.length === 2
        ? "grid-cols-2"
        : availableTabs.length === 3
          ? "grid-cols-3"
          : "grid-cols-4";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {record && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {[
            {
              icon: Home,
              label: "Project",
              value: info?.collection || info?.name || "N/A",
            },
            {
              icon: Hammer,
              label: "Type",
              value:
                (info?.type && RECORD_TYPE_LABELS[info.type]) ||
                info?.trade ||
                "General",
            },
            {
              icon: DollarSign,
              label: "Total Cost",
              value: money(record.cost?.total) || "N/A",
            },
            {
              icon: Calendar,
              label: "Date",
              value: info?.date || "N/A",
            },
          ].map((card) => (
            <motion.div key={card.label} variants={staggerItem}>
              <Card className="bg-surface-raised border border-line">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-inset border border-line flex items-center justify-center flex-shrink-0">
                      <card.icon className="w-4 h-4 text-ink-muted" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-ink-subtle font-medium uppercase tracking-wider">
                        {card.label}
                      </div>
                      <div className="text-sm font-medium text-ink truncate">
                        {card.value}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div {...fadeIn} transition={{ duration: 0.4, delay: 0.2 }}>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className={`grid w-full ${gridCols} bg-surface-inset gap-1 p-1 rounded-xl`}>
            {availableTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-surface-raised data-[state=active]:shadow-sm text-xs sm:text-sm"
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Before/After Photos */}
          <TabsContent value="images" className="mt-6">
            {data.imageMatches && data.imageMatches.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-6"
              >
                {data.imageMatches.map((match, index) => (
                  <motion.div key={index} variants={staggerItem}>
                    <Card className="bg-surface-raised border border-line overflow-hidden">
                      <CardHeader className="pb-3 pt-4 px-5">
                        <CardTitle className="text-sm font-medium text-ink flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-surface-inset text-ink flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          {match.category.replace(/_/g, " ")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 pb-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Before */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-inset text-ink-muted text-[11px] font-medium uppercase tracking-wide border border-line">
                                Before
                              </span>
                            </div>
                            {match.before ? (
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="relative cursor-pointer rounded-xl overflow-hidden border border-line bg-surface-sunken"
                                onClick={() =>
                                  setSelectedImage(match.before!.url!)
                                }
                              >
                                <img
                                  src={match.before.url}
                                  alt={`Before ${match.category}`}
                                  className="w-full aspect-[4/3] object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors rounded-xl" />
                              </motion.div>
                            ) : (
                              <div className="w-full aspect-[4/3] bg-surface-sunken border border-line rounded-xl flex items-center justify-center">
                                <span className="text-ink-subtle text-sm">
                                  No before image
                                </span>
                              </div>
                            )}
                          </div>

                          {/* After */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-verified-surface text-verified text-[11px] font-medium uppercase tracking-wide border border-verified-line">
                                After
                              </span>
                            </div>
                            {match.after ? (
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="relative cursor-pointer rounded-xl overflow-hidden border border-line bg-surface-sunken"
                                onClick={() =>
                                  setSelectedImage(match.after!.url!)
                                }
                              >
                                <img
                                  src={match.after.url}
                                  alt={`After ${match.category}`}
                                  className="w-full aspect-[4/3] object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors rounded-xl" />
                              </motion.div>
                            ) : (
                              <div className="w-full aspect-[4/3] bg-surface-sunken border border-line rounded-xl flex items-center justify-center">
                                <span className="text-ink-subtle text-sm">
                                  No after image
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </TabsContent>

          {/* Details */}
          <TabsContent value="details" className="mt-6">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              <motion.div variants={staggerItem}>
                <Card className="bg-surface-raised border border-line">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-ink">
                      <Home className="w-4 h-4 text-ink-muted" />
                      Project Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Name", value: info?.name },
                        {
                          label: "Type",
                          value:
                            info?.type && RECORD_TYPE_LABELS[info.type]
                              ? RECORD_TYPE_LABELS[info.type]
                              : info?.type,
                        },
                        { label: "Collection", value: info?.collection },
                        { label: "Trade", value: info?.trade },
                      ].map((item) => (
                        <div key={item.label}>
                          <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider">
                            {item.label}
                          </label>
                          <p className="text-sm text-ink font-medium">
                            {item.value || "N/A"}
                          </p>
                        </div>
                      ))}
                    </div>
                    {tags.length > 0 && (
                      <div>
                        <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider">
                          Rooms &amp; Systems
                        </label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-inset text-ink-muted text-xs border border-line"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {record?.cost && (
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        {[
                          { label: "Labor", value: money(record.cost.labor) },
                          {
                            label: "Materials",
                            value: money(record.cost.materials),
                          },
                          { label: "Permit", value: record.cost.permitNo },
                        ].map((item) => (
                          <div key={item.label}>
                            <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider">
                              {item.label}
                            </label>
                            <p className="text-sm text-ink font-medium">
                              {item.value || "N/A"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Card className="bg-surface-raised border border-line">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-ink">
                      <ShieldCheck className="w-4 h-4 text-verified" />
                      Contractor &amp; Warranty
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    {[
                      { label: "Contractor", value: record?.contractor?.name },
                      { label: "License", value: record?.contractor?.license },
                      { label: "Phone", value: record?.contractor?.phone },
                    ].map((item) => (
                      <div key={item.label}>
                        <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider">
                          {item.label}
                        </label>
                        <p className="text-sm text-ink font-medium">
                          {item.value || "N/A"}
                        </p>
                      </div>
                    ))}
                    <div>
                      <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider">
                        Warranty
                      </label>
                      <p className="text-sm text-ink font-medium">
                        {record?.warranty?.term ||
                          record?.contractor?.warranty ||
                          "N/A"}
                        {record?.warranty?.expires
                          ? ` (until ${record.warranty.expires})`
                          : ""}
                      </p>
                    </div>
                    {record?.inspection && (
                      <div>
                        <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider">
                          Inspection
                        </label>
                        <p className="text-sm text-ink flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-ink-subtle" />
                          {record.inspection.result
                            ? record.inspection.result.toUpperCase()
                            : "N/A"}
                          {record.inspection.date
                            ? ` · ${record.inspection.date}`
                            : ""}
                          {record.inspection.inspector
                            ? ` · ${record.inspection.inspector}`
                            : ""}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-6">
            {data.documents && data.documents.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {data.documents.map((doc, index) => (
                  <DocumentCard
                    key={index}
                    doc={doc}
                    onExpand={setSelectedDoc}
                  />
                ))}
              </motion.div>
            ) : null}
          </TabsContent>

          {/* Materials */}
          <TabsContent value="materials" className="mt-6">
            {record?.materials && record.materials.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <Card className="bg-surface-raised border border-line">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-ink">
                      Materials &amp; Fixtures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {record.materials.map((mat, index) => (
                        <motion.div
                          key={index}
                          variants={staggerItem}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-line rounded-lg hover:bg-surface-sunken transition-colors gap-2"
                        >
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-ink">
                              {mat.item}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted mt-0.5">
                              {mat.sku && (
                                <span className="flex items-center gap-0.5">
                                  <Hash className="w-2.5 h-2.5" />
                                  {mat.sku}
                                </span>
                              )}
                              {mat.quantity && <span>Qty: {mat.quantity}</span>}
                              {mat.warranty && (
                                <span>Warranty: {mat.warranty}</span>
                              )}
                            </div>
                          </div>
                          {mat.cost != null && (
                            <div className="text-sm font-medium text-ink flex-shrink-0">
                              {money(mat.cost)}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedImage}
                alt="Project photo"
                className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-page preview — any file type, not just PDFs. */}
      <AnimatePresence>
        {selectedDoc && (
          <DocumentLightbox
            selected={selectedDoc}
            onClose={() => setSelectedDoc(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeRecordVisualization;
