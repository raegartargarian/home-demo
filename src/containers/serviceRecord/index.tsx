import { Chip } from "@/shared/components/Chip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProvenanceDetails } from "@/shared/components/ProvenanceDetails";
import HomeRecordVisualization from "@/shared/components/HomeRecordVisualization";
import { formatFileSize } from "@/shared/utils/fileHelpers";
import { cleanupHomeData } from "@/shared/utils/zipHandler";
import { NETWORK_SERVER_NAMES } from "@/shared/utils/networks";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import { viewTXInExplorer } from "@/shared/utils/viewVaultInExplorer";
import {
  AlertCircle,
  ExternalLink,
  FileText,
  HardDrive,
  Loader2,
  MapPin,
} from "lucide-react";
import { parseRoomTags } from "@/shared/utils/recordTags";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import FileViewer from "./components/FileViewer";
import { serviceRecordSelectors } from "./selectors";
import { serviceRecordActions } from "./slice";
import { PageContainer } from "@/shared/components/PageContainer";

const ServiceRecord = () => {
  const { attachmentId } = useParams<{ attachmentId: string }>();
  const dispatch = useDispatch();

  const attachment = useSelector(serviceRecordSelectors.attachment);
  const recordData = useSelector(serviceRecordSelectors.recordData);
  const isLoading = useSelector(serviceRecordSelectors.isLoading);
  const isProcessingZip = useSelector(serviceRecordSelectors.isProcessingZip);
  const error = useSelector(serviceRecordSelectors.error);

  const rooms = useMemo(
    () => parseRoomTags(attachment?.description),
    [attachment?.description],
  );

  const attachmentStatus = attachment?.status
    ? getStatusConfig(attachment.status)
    : null;

  useEffect(() => {
    if (attachmentId) {
      dispatch(serviceRecordActions.fetchStart({ id: attachmentId }));
    }
    return () => {
      if (recordData) {
        cleanupHomeData(recordData);
      }
      dispatch(serviceRecordActions.reset());
    };
  }, [dispatch, attachmentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <PageContainer measure="wide">
          <Skeleton className="h-8 w-48 mb-8 bg-surface-inset" />
          <Skeleton className="h-32 w-full mb-6 bg-surface-inset rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 bg-surface-inset rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full bg-surface-inset rounded-xl" />
        </PageContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface">
        <PageContainer measure="wide">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-alert mb-4" />
            <h2 className="text-xl font-medium tracking-tight text-ink mb-2">
              Failed to load home record
            </h2>
            <p className="text-ink-muted">{error}</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <PageContainer measure="wide">
        {/* Type on the page ground, like every other page header — see
            `PageHeader`. Not built from it, because a record's name is a long
            filename that has to wrap where a page title never does. */}
        <header className="mb-8 border-b border-line pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-inset">
                <FileText className="h-5 w-5 text-ink-muted" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-medium tracking-tight text-ink md:text-3xl">
                  {attachment?.name || "Home Record"}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {attachmentStatus && (
                    <Chip
                      label={attachmentStatus.label}
                      tone={attachmentStatus.tone}
                    />
                  )}
                  {attachment?.file_count != null && (
                    <span className="flex items-center gap-1.5 text-sm text-ink-subtle">
                      <HardDrive className="w-3.5 h-3.5" />
                      {attachment.file_count} file
                      {attachment.file_count !== 1 ? "s" : ""}
                      {attachment.size
                        ? ` (${formatFileSize(attachment.size)})`
                        : ""}
                    </span>
                  )}
                </div>
                {/* Where the work was, as opposed to where the record is
                    filed. Tags, so a record can carry more than one. */}
                {rooms.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {rooms.map((room) => (
                      <li
                        key={room.code}
                        className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-inset px-2 py-0.5 text-[11px] font-medium text-ink-muted"
                      >
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                        {room.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {attachment?.tx_hash && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    viewTXInExplorer(
                      attachment.tx_hash!,
                      attachment.ledger as NETWORK_SERVER_NAMES,
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Transaction
                </Button>
              )}
            </div>
          </div>

          {/* The same disclosure the vault and section pages carry, rather
              than this page's own hand-rolled verification banner. */}
          <ProvenanceDetails
            className="mt-5"
            txHash={attachment?.tx_hash}
            ledger={attachment?.ledger}
            createdAt={attachment?.created_at}
            createdLabel="Filed"
            rows={
              attachment?.stream?.asset_code
                ? [
                    {
                      label: "Stream",
                      value: attachment.stream.asset_code,
                      copyable: true,
                    },
                  ]
                : []
            }
          />
        </header>

        {/* Processing state */}
        {isProcessingZip && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-ink-muted mb-4" />
            <p className="text-ink font-medium">Processing home record...</p>
            <p className="text-sm text-ink-muted mt-1">
              Extracting project details, photos, and documents
            </p>
          </div>
        )}

        {/* Home Record Visualization */}
        {recordData && <HomeRecordVisualization data={recordData} />}

        {/* Non-zip file viewer */}
        {!isProcessingZip && !recordData && attachment && (
          <FileViewer attachment={attachment} />
        )}
      </PageContainer>
    </div>
  );
};

export default ServiceRecord;
