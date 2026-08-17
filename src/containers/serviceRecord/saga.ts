import { getSingleAttachment } from "@/shared/providers/api";
import {
  getIPFSIMGAddr,
  getIPFSIMGAddrPrivate,
} from "@/shared/utils/getIPFSAddrs";
import { LocalStorageKeys } from "@/shared/utils/localStorageHelpers";
import {
  IndividualFileInput,
  processHomeZipFile,
  processIndividualHomeFiles,
} from "@/shared/utils/zipHandler";
import axios from "axios";
import { call, put, takeLatest } from "redux-saga/effects";
import { serviceRecordActions } from "./slice";
import { AttachmentModel } from "./types";

function* fetchServiceRecordSaga(
  action: ReturnType<typeof serviceRecordActions.fetchStart>
): any {
  try {
    const { id } = action.payload;

    // 1. Fetch attachment detail
    const response = yield call(getSingleAttachment, id);
    const attachment: AttachmentModel = response.data;
    yield put(serviceRecordActions.fetchSuccess(attachment));

    // 2. Separate zip files from individual files
    const allFiles = attachment.files;
    const zipFiles = allFiles?.filter(
      (file) => file.filename?.match(/\.(zip)$/i) != null
    );

    const isPublic = attachment.public_vault !== false;

    function buildIPFSConfig(isPublicVault: boolean) {
      const config: any = { responseType: "arraybuffer" };
      if (!isPublicVault) {
        const token = localStorage.getItem(LocalStorageKeys.jwtAccessKey);
        if (token) {
          config.headers = {
            Authorization: `Bearer ${token.replace(/"/g, "")}`,
            "X-LedgerInfo": JSON.stringify({
              tx_hash: attachment.tx_hash,
              ledger: attachment.ledger,
            }),
          };
        }
      }
      return config;
    }

    if (zipFiles && zipFiles.length > 0) {
      // Old path: files were uploaded as a zip bundle
      yield put(serviceRecordActions.setProcessingZip(true));

      const zipFile = zipFiles[0];
      const zipAddr = isPublic
        ? getIPFSIMGAddr(zipFile.cid ?? "")
        : getIPFSIMGAddrPrivate(zipFile.cid ?? "");

      const zipResponse = yield call(
        axios.get,
        zipAddr,
        buildIPFSConfig(isPublic)
      );

      const processedContent = yield call(
        processHomeZipFile,
        zipResponse.data
      );

      if (processedContent.type === "home-record") {
        yield put(serviceRecordActions.setRecordData(processedContent));
      }
    } else if (allFiles && allFiles.length > 0) {
      // Individual files uploaded without a zip. Only run them through the
      // home-record pipeline when they actually look like record content
      // (a record JSON, or before/after "before_"/"after_"/"old_"/"new_"
      // images). Plain document streams (e.g. deed, insurance, warranty) are
      // left to FileViewer, which shows each PDF/image inline.
      const looksLikeRecord = allFiles.some((file) => {
        const name = file.filename?.toLowerCase() ?? "";
        return name.endsWith(".json") || /^(old|new|before|after)_/.test(name);
      });

      if (!looksLikeRecord) {
        // repairData stays null and isProcessingZip stays false, so the
        // ServiceRecord page falls through to <FileViewer />.
        return;
      }

      yield put(serviceRecordActions.setProcessingZip(true));

      const config = buildIPFSConfig(isPublic);
      const downloadedFiles: IndividualFileInput[] = [];

      for (const file of allFiles) {
        if (!file.cid || !file.filename) continue;
        const addr = isPublic
          ? getIPFSIMGAddr(file.cid)
          : getIPFSIMGAddrPrivate(file.cid);
        const resp = yield call(axios.get, addr, config);
        downloadedFiles.push({ filename: file.filename, data: resp.data });
      }

      const processedContent = yield call(
        processIndividualHomeFiles,
        downloadedFiles
      );

      if (processedContent.type === "home-record") {
        yield put(serviceRecordActions.setRecordData(processedContent));
      }
    }
  } catch (error: any) {
    yield put(serviceRecordActions.fetchFailure(error.message));
  }
}

export function* serviceRecordSaga() {
  yield takeLatest(
    serviceRecordActions.fetchStart.type,
    fetchServiceRecordSaga
  );
}
