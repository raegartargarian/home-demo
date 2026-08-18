import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyableHash } from "@/shared/components/CopyableHash";
import HomeRecordVisualization from "@/shared/components/HomeRecordVisualization";
import { formatDate } from "@/shared/utils/dateFormatter";
import { formatFileSize } from "@/shared/utils/fileHelpers";
import { cleanupHomeData } from "@/shared/utils/zipHandler";
import {
  getLedgerNameFromServerName,
  NETWORK_SERVER_NAMES,
} from "@/shared/utils/networks";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import { viewTXInExplorer } from "@/shared/utils/viewVaultInExplorer";
import {
  AlertCircle,
  Calendar,
  ExternalLink,
  FileText,
  HardDrive,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useEffect } from "react";
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
        {/* Attachment Header */}
        <div className="bg-surface-raised rounded-xl border border-line p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-inset border border-line flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-ink-muted" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-medium tracking-tight text-ink">
                  {attachment?.name || "Home Record"}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {attachment?.created_at && (
                    <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(attachment.created_at)}
                    </span>
                  )}
                  {attachmentStatus && (
                    <Badge
                      variant="secondary"
                      className={attachmentStatus.className}
                    >
                      {attachmentStatus.label}
                    </Badge>
                  )}
                  {attachment?.ledger && (
                    <Badge
                      variant="secondary"
                      className="bg-surface-inset text-ink-muted border-line"
                    >
                      {getLedgerNameFromServerName(attachment.ledger) ||
                        attachment.ledger}
                    </Badge>
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
                {attachment?.stream?.asset_code && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-ink-subtle">
                    <span>Stream:</span>
                    <CopyableHash value={attachment.stream.asset_code} />
                  </div>
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
                  className="border-line text-ink-muted hover:bg-surface-inset"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Transaction
                </Button>
              )}
            </div>
          </div>

          {/* Blockchain verification banner */}
          {attachment?.tx_hash && (
            <div className="mt-4 pt-4 border-t border-line flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-verified" />
              <span className="text-sm text-verified font-medium">
                Verified on blockchain
              </span>
              <CopyableHash value={attachment.tx_hash} />
            </div>
          )}
        </div>

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
