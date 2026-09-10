import { parseNestedTemplateName } from "@/containers/projectVaults/naming";
import { PROJECT_VAULTS_ENABLED } from "@/shared/constants/projectVaults";
import { ALL_TEMPLATE_IDS } from "@/shared/constants/scenarios";
import {
  addStreamToVault,
  getSingleTemplate,
  getSingleVault,
} from "@/shared/providers/api";
import { VaultDto } from "@/shared/types/vault";
import { sleep } from "@/shared/utils/polling";
import { PayloadAction } from "@reduxjs/toolkit";
import { SagaIterator } from "redux-saga";
import { call, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { vaultDetailSelectors } from "./selectors";
import { vaultDetailActions } from "./slice";
import { AddSectionInput, SectionCreation } from "./types";

/**
 * The home a project belongs to, or null.
 *
 * A home is seeded under one of the scenario templates; anything else could be
 * a project, whose template name carries the parent link. Best effort: a
 * failure anywhere here leaves the page a plain vault rather than blocking it.
 */
function* resolveParent(vault: VaultDto): SagaIterator<VaultDto | null> {
  if (
    !PROJECT_VAULTS_ENABLED ||
    !vault.template_id ||
    ALL_TEMPLATE_IDS.includes(vault.template_id)
  ) {
    return null;
  }
  try {
    const template = yield call(getSingleTemplate, vault.template_id);
    const ref = parseNestedTemplateName(template.data?.name);
    if (ref?.kind !== "child") return null;
    const parent = yield call(getSingleVault, ref.parentVaultId);
    return (parent.data as VaultDto) ?? null;
  } catch (error) {
    console.error("Failed to resolve the project's home:", error);
    return null;
  }
}

/**
 * How far up the walk will go before giving up.
 *
 * A home with projects under it is two levels; anything approaching this is
 * either a mistake or a loop the cycle guard has not caught. The cap is what
 * stops a malformed chain turning into an unbounded request storm.
 */
const MAX_ANCESTOR_DEPTH = 8;

/**
 * Everything above `from`, root-first, not including `from` itself.
 *
 * `resolveParent` already stops at a home, at an unparseable template name and
 * at any failure, so the loop terminates on its own; the cap and the `seen` set
 * are there for a template that has been edited into a cycle.
 */
function* resolveAncestors(from: VaultDto): SagaIterator<VaultDto[]> {
  const chain: VaultDto[] = [];
  const seen = new Set<string>([from.id]);
  let current = from;

  for (let hop = 0; hop < MAX_ANCESTOR_DEPTH; hop++) {
    const next: VaultDto | null = yield call(resolveParent, current);
    if (!next || seen.has(next.id)) break;
    seen.add(next.id);
    chain.unshift(next);
    current = next;
  }

  return chain;
}

function* fetchVaultDetailSaga(
  action: ReturnType<typeof vaultDetailActions.fetchVaultDetailStart>,
): SagaIterator {
  try {
    const { id } = action.payload;
    const response = yield call(getSingleVault, id);
    // Settled before the page renders: a project shown as a home for a beat
    // would mount the Projects block and go looking for projects under itself.
    const parent: VaultDto | null = yield call(resolveParent, response.data);
    yield put(vaultDetailActions.setVaultAncestors(parent ? [parent] : []));
    yield put(vaultDetailActions.fetchVaultDetailSuccess(response.data));

    // The rest of the chain costs two requests a level and nothing on the page
    // waits for it — the structure sidebar just re-roots one level higher when
    // it lands. `takeLatest` drops it on the way out.
    if (parent) {
      const above: VaultDto[] = yield call(resolveAncestors, parent);
      if (above.length) {
        yield put(vaultDetailActions.setVaultAncestors([...above, parent]));
      }
    }
  } catch (error) {
    yield put(
      vaultDetailActions.fetchVaultDetailFailure(
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
}

/**
 * How long to wait for a new stream to be anchored: 90 seconds, as in
 * filedgr-web-app. Shorter than the vault-creation waits — a stream is one
 * object on the chain, not a template, an image and a vault in sequence.
 */
const STREAM_POLL_MS = 3_000;
const STREAM_MAX_POLLS = 30;

/**
 * What to put on the failed card.
 *
 * The backend's own sentence where it sent one — it is the only party that
 * knows why, and "this vault does not allow new sections" is worth reading.
 * Axios's `message` is not: "Request failed with status code 400" tells a
 * homeowner nothing, so anything else falls back to plain words.
 */
const addSectionError = (error: unknown): string =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ||
  (error instanceof Error && !/^Request failed/.test(error.message)
    ? error.message
    : "") ||
  "The section could not be added.";

/**
 * The refreshed vault, but only if it is still the one on screen.
 *
 * Anchoring takes up to a minute and a half, and nothing stops the homeowner
 * opening another home in the meantime. Without this, the run would finish and
 * put its own vault into a store that has since been filled with a different
 * one — the new page would silently become the old house.
 */
function* refreshIfStillOpen(vault: VaultDto): SagaIterator<void> {
  const current: VaultDto | null = yield select(vaultDetailSelectors.vault);
  if (current?.id === vault.id) {
    yield put(vaultDetailActions.fetchVaultDetailSuccess(vault));
  }
}

/** A stream the backend has stopped working on, one way or the other. */
const isStreamSettled = (status?: string): boolean =>
  status === "FILEDGR_STREAM_COMPLETED" || status === "ERROR";

/**
 * Adds one section to a vault that already exists.
 *
 * The five-section taxonomy is what a home is *seeded* with; this is how a
 * homeowner adds the sixth when their house needs one the template did not
 * name. `mapping` is the only field that matters — it is what every part of
 * this app reads back to decide what a section is — so the form settles it and
 * this only has to carry it across.
 *
 * The request returns as soon as the stream is accepted, and the vault has no
 * section to show until it has been anchored. So it polls, and the placeholder
 * card in the grid holds the section's slot until it can be replaced by the
 * real one.
 */
function* addSectionSaga(action: PayloadAction<AddSectionInput>): SagaIterator {
  const { vaultId, mapping, description } = action.payload;
  yield put(vaultDetailActions.sectionCreationStarted(action.payload));

  try {
    const response = yield call(addStreamToVault, vaultId, {
      mapping,
      description: description || null,
      // The five a vault is seeded with are required; one added afterwards is
      // not, and marking it so would make an empty section look like a gap.
      required: false,
    });
    if (response.status !== 200) {
      throw new Error("The section could not be added.");
    }

    for (let attempt = 0; ; attempt++) {
      const check = yield call(getSingleVault, vaultId);
      const vault = check.data as VaultDto | undefined;
      const stream = vault?.streams?.find((it) => it.mapping === mapping);

      // Out of patience, but the section exists — it is still being anchored,
      // and its own card says so through the verification badge. Better shown
      // unfinished than reported as a failure that did not happen.
      if (attempt >= STREAM_MAX_POLLS) {
        if (vault) yield call(refreshIfStillOpen, vault);
        yield put(vaultDetailActions.dismissSectionCreation());
        return;
      }

      if (vault && stream && isStreamSettled(stream.status)) {
        // The vault gets the section either way, because that is what is on
        // the backend now. An ERROR only changes what is said about it — and
        // it is not retryable, since a retry would ask for a second section
        // under the same name rather than finishing this one.
        yield call(refreshIfStillOpen, vault);
        if (stream.status === "ERROR") {
          yield put(
            vaultDetailActions.addSectionFailure({
              error: "The section was added but could not be finished.",
              retryable: false,
            }),
          );
        } else {
          yield put(vaultDetailActions.dismissSectionCreation());
        }
        return;
      }

      yield call(sleep, STREAM_POLL_MS);
    }
  } catch (error) {
    yield put(
      vaultDetailActions.addSectionFailure({
        error: addSectionError(error),
        retryable: true,
      }),
    );
  }
}

/**
 * One at a time. `takeEvery` rather than `takeLatest`: cancelling a run that
 * has already created its stream would strand the card at "adding" while the
 * section quietly appeared on the backend. The guard drops the duplicate
 * instead — the form and the card are both disabled while one is in flight,
 * so this is belt and braces.
 */
function* guardedAddSectionSaga(
  action: PayloadAction<AddSectionInput>,
): SagaIterator {
  const creation: SectionCreation | null = yield select(
    vaultDetailSelectors.sectionCreation,
  );
  if (creation?.status === "running") return;
  yield call(addSectionSaga, action);
}

export function* vaultDetailSaga() {
  yield takeLatest(
    vaultDetailActions.fetchVaultDetailStart.type,
    fetchVaultDetailSaga,
  );
  yield takeEvery(
    vaultDetailActions.addSectionStart.type,
    guardedAddSectionSaga,
  );
}
