import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Storage key used to persist wallet activity history in AsyncStorage.
 */
const ACTIVITY_STORAGE_KEY = "wallet_activity_v1";

/**
 * Time window used to suppress duplicate activity records for the same
 * credential/action pair.
 *
 * This helps avoid noisy duplicate entries when the same event is triggered
 * multiple times in quick succession.
 */
const DUPLICATE_WINDOW_MS = 5000;

/**
 * Supported activity event types recorded in the wallet.
 */
export type ActivityActionType =
  | "credential_presented"
  | "verification_success"
  | "verification_failure"
  | "status_changed"
  | "credential_expired"
  | "credential_revoked"
  | "credential_updated";

/**
 * Origin of the activity event.
 *
 * - system: generated internally by the app
 * - user: directly triggered by user behaviour
 * - verifier: generated during verification flow
 */
export type ActivitySource = "system" | "user" | "verifier";

/**
 * Optional metadata attached to an activity record.
 *
 * Different activity types use different subsets of this metadata.
 */
export type WalletActivityMetadata = {
  issuer?: string;
  credentialStatus?: string;
  previousStatus?: string;
  nextStatus?: string;
  verifierName?: string;
  verificationOutcome?: "success" | "failure";
  reason?: string;
};

/**
 * Canonical wallet activity record stored in local persistence.
 */
export type WalletActivity = {
  id: string;
  credentialId: string;
  credentialTitle: string;
  actionType: ActivityActionType;
  timestamp: string;
  source: ActivitySource;
  summary: string;
  metadata?: WalletActivityMetadata;
};

/**
 * Standard response shape for retrieving all activity history.
 */
type ActivityListResponse = {
  activities: WalletActivity[];
};

/**
 * Standard response shape for retrieving activity history for one credential.
 */
type ActivityByCredentialResponse = {
  credentialId: string;
  activities: WalletActivity[];
};

/**
 * Input used when creating a new activity before id/timestamp are added.
 */
type NewActivityInput = Omit<WalletActivity, "id" | "timestamp">;

/**
 * Type guard to ensure a value is one of the supported activity action types.
 *
 * @param value Unknown value to validate
 * @returns True if the value matches a valid ActivityActionType
 */
function isValidActivityActionType(value: unknown): value is ActivityActionType {
  return (
    value === "credential_presented" ||
    value === "verification_success" ||
    value === "verification_failure" ||
    value === "status_changed" ||
    value === "credential_expired" ||
    value === "credential_revoked" ||
    value === "credential_updated"
  );
}

/**
 * Type guard to ensure a value is one of the supported activity sources.
 *
 * @param value Unknown value to validate
 * @returns True if the value matches a valid ActivitySource
 */
function isValidActivitySource(value: unknown): value is ActivitySource {
  return value === "system" || value === "user" || value === "verifier";
}

/**
 * Validates and sanitises a raw object into a WalletActivity record.
 *
 * This is used when reading persisted activity from storage so malformed or
 * outdated records do not break the UI.
 *
 * @param item Raw parsed JSON value
 * @returns A valid WalletActivity object, or null if invalid
 */
function sanitiseActivity(item: unknown): WalletActivity | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const candidate = item as Record<string, unknown>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.credentialId !== "string" ||
    typeof candidate.credentialTitle !== "string" ||
    typeof candidate.timestamp !== "string" ||
    typeof candidate.summary !== "string" ||
    !isValidActivityActionType(candidate.actionType) ||
    !isValidActivitySource(candidate.source)
  ) {
    return null;
  }

  const metadata =
    candidate.metadata && typeof candidate.metadata === "object"
      ? (candidate.metadata as WalletActivityMetadata)
      : undefined;

  return {
    id: candidate.id,
    credentialId: candidate.credentialId,
    credentialTitle: candidate.credentialTitle,
    actionType: candidate.actionType,
    timestamp: candidate.timestamp,
    source: candidate.source,
    summary: candidate.summary,
    metadata,
  };
}

/**
 * Safely parses stored activity JSON.
 *
 * Invalid JSON, unexpected data shapes, or malformed activity records are
 * ignored rather than throwing runtime errors.
 *
 * @param raw Raw JSON string from AsyncStorage
 * @returns Array of valid WalletActivity records
 */
function safeParseActivities(raw: string | null): WalletActivity[] {
  try {
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => sanitiseActivity(item))
      .filter((item): item is WalletActivity => item !== null);
  } catch {
    return [];
  }
}

/**
 * Sorts activities in descending timestamp order so the newest items appear
 * first in the UI.
 *
 * @param activities Activity list to sort
 * @returns New array sorted from newest to oldest
 */
function sortNewestFirst(activities: WalletActivity[]): WalletActivity[] {
  return [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Generates a lightweight unique id for new activity entries.
 *
 * @returns Unique activity identifier
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Loads all persisted activity history from storage.
 *
 * @returns Sorted list of wallet activity records
 */
async function loadActivities(): Promise<WalletActivity[]> {
  const raw = await AsyncStorage.getItem(ACTIVITY_STORAGE_KEY);
  return sortNewestFirst(safeParseActivities(raw));
}

/**
 * Persists activity history to storage after sorting it newest-first.
 *
 * @param activities Activity list to save
 */
async function persistActivities(activities: WalletActivity[]): Promise<void> {
  await AsyncStorage.setItem(
    ACTIVITY_STORAGE_KEY,
    JSON.stringify(sortNewestFirst(activities))
  );
}

/**
 * Appends a single activity record to the existing stored history.
 *
 * @param activity Fully-formed WalletActivity record
 */
async function appendActivity(activity: WalletActivity): Promise<void> {
  const existing = await loadActivities();
  await persistActivities([activity, ...existing]);
}

/**
 * Creates a complete WalletActivity object by adding generated id and timestamp.
 *
 * @param input Partial activity input
 * @returns Fully-formed WalletActivity record
 */
function createActivity(input: NewActivityInput): WalletActivity {
  return {
    ...input,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Checks whether an activity of the same type has recently been recorded for
 * the same credential.
 *
 * This is used to suppress duplicate activity events caused by repeated calls
 * within a short time window.
 *
 * @param credentialId Credential identifier
 * @param actionType Activity type to check
 * @param windowMs Duplicate detection window in milliseconds
 * @returns True if a recent matching activity already exists
 */
async function hasRecentActivity(
  credentialId: string,
  actionType: ActivityActionType,
  windowMs = DUPLICATE_WINDOW_MS
): Promise<boolean> {
  const activities = await loadActivities();
  const now = Date.now();

  return activities.some((activity) => {
    if (
      activity.credentialId !== credentialId ||
      activity.actionType !== actionType
    ) {
      return false;
    }

    const activityTime = new Date(activity.timestamp).getTime();
    return now - activityTime < windowMs;
  });
}

/**
 * Records a new activity event, optionally suppressing duplicates if a similar
 * event has been logged recently.
 *
 * @param input Activity details before id/timestamp generation
 * @param options Optional duplicate suppression settings
 */
async function recordActivity(
  input: NewActivityInput,
  options?: {
    suppressDuplicateWithinMs?: number;
  }
): Promise<void> {
  const duplicateWindowMs = options?.suppressDuplicateWithinMs;

  if (duplicateWindowMs !== undefined) {
    const isDuplicate = await hasRecentActivity(
      input.credentialId,
      input.actionType,
      duplicateWindowMs
    );

    if (isDuplicate) {
      return;
    }
  }

  await appendActivity(createActivity(input));
}

/**
 * Returns the full activity history as a plain array.
 *
 * @returns All stored activity records
 */
export async function fetchActivityHistory(): Promise<WalletActivity[]> {
  return loadActivities();
}

/**
 * Returns the full activity history wrapped in a response object.
 *
 * Useful where a stable API-style response shape is preferred.
 *
 * @returns Object containing all activity records
 */
export async function getActivityHistory(): Promise<ActivityListResponse> {
  const activities = await loadActivities();
  return { activities };
}

/**
 * Retrieves all activity associated with a specific credential.
 *
 * @param credentialId Credential identifier
 * @returns Matching activity records
 */
export async function getActivityForCredential(
  credentialId: string
): Promise<WalletActivity[]> {
  const activities = await loadActivities();
  return activities.filter((activity) => activity.credentialId === credentialId);
}

/**
 * Retrieves activity history for a single credential wrapped in a response
 * object.
 *
 * @param credentialId Credential identifier
 * @returns Object containing credential id and matching activity records
 */
export async function getActivityHistoryByCredential(
  credentialId: string
): Promise<ActivityByCredentialResponse> {
  const activities = await getActivityForCredential(credentialId);
  return {
    credentialId,
    activities,
  };
}

/**
 * Clears all activity history from local storage.
 */
export async function clearActivityHistory(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVITY_STORAGE_KEY);
}

/**
 * Records that a credential has been presented by the user.
 *
 * Duplicate events are suppressed within the standard duplicate window.
 *
 * @param params Credential and context details
 */
export async function recordCredentialPresented({
  credential_id,
  title,
  issuer,
  status,
}: {
  credential_id: string;
  title: string;
  issuer?: string;
  status?: string;
}): Promise<void> {
  await recordActivity(
    {
      credentialId: credential_id,
      credentialTitle: title,
      actionType: "credential_presented",
      source: "user",
      summary: "Credential presented",
      metadata: {
        issuer,
        credentialStatus: status,
      },
    },
    { suppressDuplicateWithinMs: DUPLICATE_WINDOW_MS }
  );
}

/**
 * Records the outcome of a verification attempt.
 *
 * Duplicate events are suppressed within the standard duplicate window.
 *
 * @param params Verification result details
 */
export async function recordVerificationResult({
  credential_id,
  title,
  success,
  verifierName,
  reason,
}: {
  credential_id: string;
  title: string;
  success: boolean;
  verifierName?: string;
  reason?: string;
}): Promise<void> {
  await recordActivity(
    {
      credentialId: credential_id,
      credentialTitle: title,
      actionType: success
        ? "verification_success"
        : "verification_failure",
      source: "verifier",
      summary: success ? "Verification successful" : "Verification failed",
      metadata: {
        verifierName,
        verificationOutcome: success ? "success" : "failure",
        reason,
      },
    },
    { suppressDuplicateWithinMs: DUPLICATE_WINDOW_MS }
  );
}

/**
 * Records a status change for a credential.
 *
 * @param params Previous and next credential status values
 */
export async function recordCredentialStatusChange({
  credential_id,
  title,
  previousStatus,
  nextStatus,
}: {
  credential_id: string;
  title: string;
  previousStatus?: string;
  nextStatus?: string;
}): Promise<void> {
  await recordActivity({
    credentialId: credential_id,
    credentialTitle: title,
    actionType: "status_changed",
    source: "system",
    summary: "Status changed",
    metadata: {
      previousStatus,
      nextStatus,
    },
  });
}

/**
 * Records that a credential has expired.
 *
 * Duplicate events are suppressed within the standard duplicate window.
 *
 * @param params Credential expiry details
 */
export async function recordCredentialExpired({
  credential_id,
  title,
  issuer,
  previousStatus,
}: {
  credential_id: string;
  title: string;
  issuer?: string;
  previousStatus?: string;
}): Promise<void> {
  await recordActivity(
    {
      credentialId: credential_id,
      credentialTitle: title,
      actionType: "credential_expired",
      source: "system",
      summary: "Credential expired",
      metadata: {
        issuer,
        previousStatus,
        nextStatus: "expired",
        credentialStatus: "expired",
      },
    },
    { suppressDuplicateWithinMs: DUPLICATE_WINDOW_MS }
  );
}

/**
 * Records that a credential has been revoked.
 *
 * Duplicate events are suppressed within the standard duplicate window.
 *
 * @param params Credential revocation details
 */
export async function recordCredentialRevoked({
  credential_id,
  title,
  issuer,
  previousStatus,
  reason,
}: {
  credential_id: string;
  title: string;
  issuer?: string;
  previousStatus?: string;
  reason?: string;
}): Promise<void> {
  await recordActivity(
    {
      credentialId: credential_id,
      credentialTitle: title,
      actionType: "credential_revoked",
      source: "system",
      summary: "Credential revoked",
      metadata: {
        issuer,
        previousStatus,
        nextStatus: "revoked",
        credentialStatus: "revoked",
        reason,
      },
    },
    { suppressDuplicateWithinMs: DUPLICATE_WINDOW_MS }
  );
}