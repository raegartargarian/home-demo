import {
  createTemplate,
  createVault,
  getSingleTemplate,
  getSingleVault,
  updateVaultImageStatus,
  uploadTemplateImage,
} from "@/shared/providers/api";
import { VaultDto } from "@/shared/types/vault";
import { PayloadAction } from "@reduxjs/toolkit";
import { eventChannel, SagaIterator } from "redux-saga";
import { call, put, select, take, takeEvery } from "redux-saga/effects";
import { fetchProjectVaults } from "./api";
import { fetchHomeImage, toCoverImage } from "./image";
import { buildChildTemplateName } from "./naming";
import { projectVaultsSelectors } from "./selectors";
import { projectVaultsActions } from "./slice";
import { CreateProjectInput, ProjectCreation } from "./types";

/** Polling bound shared by every wait below, as in filedgr-web-app. */
const MAX_POLLS = 20;
const POLL_MS = 5_000;

/** A vault is far enough along once it reaches any of these. */
const VAULT_SYNCED_STATUSES: ReadonlySet<string> = new Set([
  "FILEDGR_METADATA_UPLOADED",
  "FILEDGR_VAULT_FINISHED",
  "FILEDGR_VAULT_COMPLETED",
  "FILEDGR_METADATA_GENERATED",
  "DLT_VAULT_ID_REQUESTED",
  "FILEDGR_IMAGE_UPLOADED",
]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The slice of a template the create flow reads back. */
interface TemplateDto {
  public?: boolean;
  required_tokens?: string[];
  config?: {
    is_permissioned?: boolean;
    is_searchable?: boolean;
    is_ai_ready?: boolean;
    is_dynamic_streams?: boolean;
  };
}

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error ?? "");

const isUnauthorized = (error: unknown): boolean =>
  (error as { response?: { status?: number }; status?: number })?.response
    ?.status === 401 ||
  (error as { status?: number })?.status === 401 ||
  errorText(error).includes("401");

function* fetchProjectsSaga(
  action: PayloadAction<{ parentVaultId: string }>
): SagaIterator {
  const { parentVaultId } = action.payload;
  try {
    const projects = yield call(fetchProjectVaults, parentVaultId);
    yield put(projectVaultsActions.fetchProjectsSuccess({ parentVaultId, projects }));
  } catch (error) {
    yield put(
      projectVaultsActions.fetchProjectsFailure({
        parentVaultId,
        error: isUnauthorized(error)
          ? "Sign in again to see this home's projects."
          : "The projects could not be loaded.",
      })
    );
  }
}

/** Upload progress as a channel, so the saga can report it as it happens. */
const uploadProgressChannel = (putUrl: string, file: File) =>
  eventChannel<number | Error>((emit) => {
    uploadTemplateImage(putUrl, file, (progress: number) => emit(progress))
      .then(() => emit(100))
      .catch((error) => emit(error instanceof Error ? error : new Error(error)));
    return () => {};
  });

function* report(step: string, progress: number | null) {
  yield put(projectVaultsActions.creationProgress({ step, progress }));
}

/**
 * The cover the template is created with. The homeowner's own photo, or the
 * home's fetched back off the gateway — either way capped and re-encoded so a
 * phone photo does not become the vault's multi-megabyte face.
 */
function* resolveCoverImage(
  input: CreateProjectInput,
  parent: VaultDto
): SagaIterator<File> {
  const source: Blob =
    input.image.kind === "file"
      ? input.image.file
      : yield call(fetchHomeImage, parent);
  const filename = `${input.label.replace(/\s+/g, "-") || "project"}.jpg`;
  return yield call(toCoverImage, source, filename);
}

/** The template once it has reached UPLOADED, which a vault needs it to be. */
function* waitForUploadedTemplate(templateId: string): SagaIterator<TemplateDto> {
  for (let attempt = 0; ; attempt++) {
    const check = yield call(getSingleTemplate, templateId);
    if (check.status === 200 && check.data?.status === "UPLOADED") {
      return check.data as TemplateDto;
    }
    if (attempt >= MAX_POLLS) {
      throw new Error("The template took too long to be ready.");
    }
    yield* report("Waiting for the template…", 45 + Math.min(attempt, 10) * 1.5);
    yield call(sleep, POLL_MS);
  }
}

/**
 * Polls a vault until its status satisfies `isReady`. Running out of patience
 * throws when `timeoutMessage` is given, and otherwise simply returns — for
 * the final sync, where the vault exists and finishes on its own.
 */
function* waitForVault(
  vaultId: string,
  isReady: (status: string) => boolean,
  timeoutMessage?: string
): SagaIterator<void> {
  for (let attempt = 0; ; attempt++) {
    const check = yield call(getSingleVault, vaultId);
    if (check.status === 200 && isReady(check.data?.status ?? "")) return;
    if (attempt >= MAX_POLLS) {
      if (timeoutMessage) throw new Error(timeoutMessage);
      return;
    }
    yield call(sleep, POLL_MS);
  }
}

/**
 * Creates the template that carries the parent link, then the vault itself —
 * the same five steps filedgr-web-app runs for a nested vault.
 *
 * The two objects are inseparable: a template with no vault is invisible
 * plumbing, and the vault cannot exist without a template that declares its
 * streams. Both therefore live inside one card in the grid, so the homeowner
 * sees one "creating project" job rather than two unrelated ones.
 */
function* createProjectSaga(
  action: PayloadAction<CreateProjectInput>
): SagaIterator {
  const input = action.payload;
  const { parentVaultId, label, description, sections } = input;
  yield put(projectVaultsActions.creationStarted(input));

  try {
    // The parent supplies the ledger and, when asked, the photo.
    const parentResponse = yield call(getSingleVault, parentVaultId);
    const parent = parentResponse.data as VaultDto;

    const cover: File = yield call(resolveCoverImage, input, parent);

    // Step 1 — the template. Its name is the only place the parent link is
    // recorded, and the section slugs as stream names are what make the
    // project's streams resolve to the same five sections as the home's.
    yield* report("Setting up the project…", 0);
    const templateResponse = yield call(createTemplate, {
      name: buildChildTemplateName(parentVaultId, label),
      description,
      // Private: a bookkeeping object, and a public one would surface in other
      // users' template pickers.
      public: false,
      required_tokens: sections,
      required_streams: sections,
      config: {
        is_permissioned: true,
        is_searchable: false,
        is_ai_ready: false,
        is_dynamic_streams: true,
      },
    });
    if (templateResponse.status !== 200) {
      throw new Error("The project's template could not be created.");
    }
    const templateId: string = templateResponse.data.id;

    // Step 2 — the cover. The vault inherits it via `useDefaultImage`, so this
    // is the only upload needed for both objects.
    yield* report("Adding the photo…", 10);
    let putUrl: string | null = templateResponse.data.image_upload_url ?? null;
    for (let attempt = 0; !putUrl; attempt++) {
      if (attempt >= MAX_POLLS) {
        throw new Error("The server never offered a place to put the photo.");
      }
      yield call(sleep, POLL_MS);
      const refreshed = yield call(getSingleTemplate, templateId);
      putUrl = refreshed.data?.image_upload_url ?? null;
    }

    const progress = yield call(uploadProgressChannel, putUrl, cover);
    let uploaded: number | Error;
    while ((uploaded = yield take(progress)) !== 100) {
      if (uploaded instanceof Error) throw uploaded;
      // 10 → 45 across the upload.
      yield* report("Adding the photo…", 10 + (uploaded as number) * 0.35);
    }

    // Step 3 — the template has to reach UPLOADED before a vault can use it.
    yield* report("Waiting for the template…", 45);
    const template: TemplateDto = yield call(waitForUploadedTemplate, templateId);

    // Step 4 — the vault. Visibility and config are copied off the template
    // rather than re-decided here, as the ordinary add-vault flow does.
    yield* report("Creating the vault…", 60);
    const vaultResponse = yield call(createVault, {
      name: label,
      description,
      public: template.public ?? false,
      // web-core types `tokens` as an empty tuple; the wire accepts the
      // template's token list, which is what filedgr-web-app sends.
      tokens: (template.required_tokens ?? []) as [],
      template_id: templateId,
      useDefaultImage: true,
      ledger: parent.ledger ?? "",
      config: {
        is_permissioned: template.config?.is_permissioned ?? true,
        is_searchable: template.config?.is_searchable ?? false,
        is_ai_ready: template.config?.is_ai_ready ?? false,
        is_dynamic_streams: template.config?.is_dynamic_streams ?? true,
        short_url: false,
      },
    });
    if (vaultResponse.status !== 200) {
      throw new Error("The project's vault could not be created.");
    }
    const vaultId: string = vaultResponse.data.id;
    yield put(projectVaultsActions.creationVaultKnown(vaultId));

    // The default image is only applied once the vault has been reviewed.
    yield call(
      waitForVault,
      vaultId,
      (status) => status === "FILEDGR_REVIEWED" || VAULT_SYNCED_STATUSES.has(status),
      "The vault took too long to be reviewed."
    );
    yield call(updateVaultImageStatus, vaultId);

    // Step 5 — blockchain and IPFS. Indeterminate: there is no meaningful
    // percentage while waiting on replication, and running out of patience
    // is not a failure — the vault exists and finishes on its own.
    yield* report("Anchoring to the blockchain…", null);
    yield call(waitForVault, vaultId, (status) => VAULT_SYNCED_STATUSES.has(status));

    yield put(projectVaultsActions.creationFinished());
    yield put(projectVaultsActions.fetchProjects({ parentVaultId }));
  } catch (error) {
    // The interceptor is already logging the homeowner out; a card left behind
    // would outlive the session it belongs to.
    if (isUnauthorized(error)) {
      yield put(projectVaultsActions.dismissCreation());
      return;
    }
    yield put(
      projectVaultsActions.creationFailed(
        errorText(error) || "Something went wrong while creating the project."
      )
    );
  }
}

/**
 * One at a time. `takeEvery` rather than `takeLatest`: a second dispatch under
 * `takeLatest` would cancel a creation already half-way through, stranding
 * its card at "running" and leaving an orphaned template behind. The guard
 * here drops the duplicate instead; the form and the New project card are
 * disabled while a run is in flight, so this is belt and braces.
 */
function* guardedCreateProjectSaga(
  action: PayloadAction<CreateProjectInput>
): SagaIterator {
  const creation: ProjectCreation | null = yield select(
    projectVaultsSelectors.creation
  );
  if (creation?.status === "running") return;
  yield call(createProjectSaga, action);
}

export function* projectVaultsSaga() {
  yield takeEvery(projectVaultsActions.fetchProjects.type, fetchProjectsSaga);
  yield takeEvery(projectVaultsActions.createProject.type, guardedCreateProjectSaga);
}
