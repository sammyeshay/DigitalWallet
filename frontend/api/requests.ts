import AsyncStorage from "@react-native-async-storage/async-storage";
import { FrontendCredential } from "./credentials";
import {
  buildExpiryActionText,
  getDaysUntilDate,
  getExpiryCycleId,
  getExpiryDateValue,
  getExpiryState,
  normaliseStatus,
} from "./expiry-config";

/**
 * Storage key used to persist wallet requests locally.
 */
const REQUESTS_STORAGE_KEY = "wallet_requests_v1";

/**
 * High-level workflow status for a request.
 *
 * - action_required: user needs to do something
 * - pending_confirmation: reserved for future confirmation flows
 * - pending_review: request is waiting for user review
 * - completed: request has been resolved
 */
export type RequestStatus =
  | "action_required"
  | "pending_confirmation"
  | "pending_review"
  | "completed";

/**
 * Display grouping used by the requests UI.
 *
 * - pending: active items needing attention
 * - past: previously completed/resolved items
 */
export type RequestType = "pending" | "past";

/**
 * Source that caused the request to exist.
 *
 * This allows the UI and business logic to distinguish between expiry-driven
 * requests, pending credentials, revoked credentials, and other system events.
 */
export type RequestSource =
  | "credential_expiry"
  | "credential_pending"
  | "credential_revoked"
  | "credential_presented"
  | "system";

/**
 * Canonical request model used by the wallet.
 */
export type WalletRequest = {
  id: string;
  credentialId?: string;
  organisation: string;
  title: string;
  subtitle: string;
  createdAt: string;
  updatedAt: string;
  statusLabel: string;
  statusColour: string;
  icon:
    | "alert-circle-outline"
    | "shield-checkmark-outline"
    | "business-outline"
    | "checkmark-done-outline"
    | "time-outline";
  type: RequestType;
  status: RequestStatus;
  source: RequestSource;
  isRead: boolean;
  metadata?: Record<string, string>;
};

/**
 * Sorts requests so the most recently updated items appear first.
 *
 * This keeps the UI focused on the newest and most relevant request activity.
 *
 * @param requests Request list to sort
 * @returns New array sorted by updatedAt descending
 */
function sortRequestsNewestFirst(requests: WalletRequest[]): WalletRequest[] {
  return [...requests].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Converts a timestamp into a short relative label for display in the UI.
 *
 * Examples:
 * - Now
 * - 14m ago
 * - 3h ago
 * - Yesterday
 * - 4d ago
 *
 * @param iso ISO timestamp string
 * @returns Human-readable relative time label
 */
function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

/**
 * Creates a new request and fills in the common default lifecycle fields.
 *
 * This keeps request creation consistent across all request builders.
 *
 * @param partial Request fields excluding timestamps and read state
 * @returns Fully-formed WalletRequest
 */
function createRequest(
  partial: Omit<WalletRequest, "createdAt" | "updatedAt" | "isRead">
): WalletRequest {
  const now = new Date().toISOString();

  return {
    ...partial,
    createdAt: now,
    updatedAt: now,
    isRead: false,
  };
}

/**
 * Builds an expiry-based request for a credential when appropriate.
 *
 * Rules:
 * - revoked credentials do not generate expiry requests
 * - only credentials currently in the "expiring" state generate a request
 * - missing/invalid/past expiry dates do not generate a request
 * - each expiry cycle gets a stable id so duplicates can be managed cleanly
 *
 * @param credential Credential to evaluate
 * @returns Expiry request or null if no request should be created
 */
function buildExpiryRequest(
  credential: FrontendCredential
): WalletRequest | null {
  const status = normaliseStatus(credential.status);
  if (status === "revoked") {
    return null;
  }

  // Keep request behaviour aligned with expiry notifications.
  if (getExpiryState(credential) !== "expiring") {
    return null;
  }

  const expiryDate = getExpiryDateValue(credential);
  const daysUntilExpiry = getDaysUntilDate(expiryDate);
  if (!expiryDate || daysUntilExpiry === null || daysUntilExpiry < 0) {
    return null;
  }

  const expiryCycle = getExpiryCycleId(credential, expiryDate);
  if (!expiryCycle) {
    return null;
  }

  return createRequest({
    id: expiryCycle,
    credentialId: credential.credential_id,
    organisation: credential.issuer,
    title: `${credential.title} Expiry Notice`,
    subtitle: buildExpiryActionText(credential.title, daysUntilExpiry),
    statusLabel: daysUntilExpiry <= 2 ? "Expiring Soon" : "Action Required",
    statusColour: "#F59E0B",
    icon: "alert-circle-outline",
    type: "pending",
    status: "action_required",
    source: "credential_expiry",
    metadata: {
      credentialStatus: credential.status,
      expiryDate,
      expiryCycle,
    },
  });
}

/**
 * Builds a request for credentials that are still in a pending state.
 *
 * @param credential Credential to evaluate
 * @returns Pending-review request or null if not applicable
 */
function buildPendingCredentialRequest(
  credential: FrontendCredential
): WalletRequest | null {
  if (normaliseStatus(credential.status) !== "pending") {
    return null;
  }

  return createRequest({
    id: `pending-${credential.credential_id}`,
    credentialId: credential.credential_id,
    organisation: credential.issuer,
    title: `${credential.title} Awaiting Review`,
    subtitle: `Your ${credential.title} is still pending. Review the credential and complete any required steps.`,
    statusLabel: "Pending Review",
    statusColour: "#F59E0B",
    icon: "shield-checkmark-outline",
    type: "pending",
    status: "pending_review",
    source: "credential_pending",
    metadata: {
      credentialStatus: credential.status,
    },
  });
}

/**
 * Builds a request for revoked credentials so the user is prompted to take
 * action.
 *
 * @param credential Credential to evaluate
 * @returns Revocation request or null if not applicable
 */
function buildRevokedCredentialRequest(
  credential: FrontendCredential
): WalletRequest | null {
  if (normaliseStatus(credential.status) !== "revoked") {
    return null;
  }

  return createRequest({
    id: `revoked-${credential.credential_id}`,
    credentialId: credential.credential_id,
    organisation: credential.issuer,
    title: `${credential.title} Revoked`,
    subtitle: `This credential is no longer valid and needs your attention.`,
    statusLabel: "Action Required",
    statusColour: "#EF4444",
    icon: "alert-circle-outline",
    type: "pending",
    status: "action_required",
    source: "credential_revoked",
    metadata: {
      credentialStatus: credential.status,
    },
  });
}

/**
 * Builds all relevant derived requests for a single credential.
 *
 * A credential may produce zero, one, or multiple requests depending on its
 * current lifecycle state.
 *
 * @param credential Credential to evaluate
 * @returns Array of valid requests for that credential
 */
function buildRequestsForCredential(
  credential: FrontendCredential
): WalletRequest[] {
  return [
    buildExpiryRequest(credential),
    buildPendingCredentialRequest(credential),
    buildRevokedCredentialRequest(credential),
  ].filter((request): request is WalletRequest => request !== null);
}

/**
 * Builds the full set of derived requests for a collection of credentials.
 *
 * @param credentials Credential list
 * @returns Flattened list of generated requests
 */
function buildDerivedRequests(
  credentials: FrontendCredential[]
): WalletRequest[] {
  return credentials.flatMap(buildRequestsForCredential);
}

/**
 * Merges freshly derived requests with the current stored request list.
 *
 * Behaviour:
 * - new derived requests are added
 * - existing pending requests keep their original createdAt, updatedAt, and
 *   read state
 * - requests already moved to the "past" bucket are preserved as historical
 *   records and not reactivated
 *
 * @param existing Existing stored requests
 * @param derived Newly generated requests from current credentials
 * @returns Merged request collection
 */
function mergeDerivedWithExisting(
  existing: WalletRequest[],
  derived: WalletRequest[]
): WalletRequest[] {
  const existingById = new Map(existing.map((request) => [request.id, request]));

  const mergedPending = derived.flatMap((request) => {
    const existingRequest = existingById.get(request.id);

    if (!existingRequest) {
      return [request];
    }

    if (existingRequest.type === "past") {
      return [];
    }

    return [
      {
        ...request,
        createdAt: existingRequest.createdAt,
        updatedAt: existingRequest.updatedAt,
        isRead: existingRequest.isRead,
      },
    ];
  });

  const preservedPast = existing.filter((request) => request.type === "past");
  return sortRequestsNewestFirst([...mergedPending, ...preservedPast]);
}

/**
 * Safely parses requests from storage.
 *
 * Invalid JSON or unexpected data shapes return an empty array rather than
 * breaking the app.
 *
 * @param raw Raw JSON string from AsyncStorage
 * @returns Parsed request list or an empty array
 */
function safeParseRequests(raw: string | null): WalletRequest[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Loads the current request collection from local storage.
 *
 * @returns Stored requests sorted newest-first
 */
async function loadRequests(): Promise<WalletRequest[]> {
  const raw = await AsyncStorage.getItem(REQUESTS_STORAGE_KEY);
  return sortRequestsNewestFirst(safeParseRequests(raw));
}

/**
 * Persists the provided request collection to local storage.
 *
 * Requests are sorted newest-first before saving to keep read and write
 * behaviour consistent.
 *
 * @param requests Request collection to store
 */
async function persistRequests(requests: WalletRequest[]): Promise<void> {
  await AsyncStorage.setItem(
    REQUESTS_STORAGE_KEY,
    JSON.stringify(sortRequestsNewestFirst(requests))
  );
}

/**
 * Loads the current request collection, applies an updater function, then saves
 * the result back to storage.
 *
 * This centralises the common read-modify-write flow used by request updates.
 *
 * @param updater Function that transforms the current request list
 * @returns Updated request collection
 */
async function updateRequestCollection(
  updater: (requests: WalletRequest[]) => WalletRequest[]
): Promise<WalletRequest[]> {
  const requests = await loadRequests();
  const updated = updater(requests);
  await persistRequests(updated);
  return updated;
}

/**
 * Applies an update function to a single request identified by id.
 *
 * @param requests Request collection
 * @param requestId Id of the request to update
 * @param updater Function to transform the matching request
 * @returns Updated request collection
 */
function updateRequestById(
  requests: WalletRequest[],
  requestId: string,
  updater: (request: WalletRequest) => WalletRequest
): WalletRequest[] {
  return requests.map((request) =>
    request.id === requestId ? updater(request) : request
  );
}

/**
 * Returns all stored wallet requests.
 *
 * @returns Request collection
 */
export async function fetchRequests(): Promise<WalletRequest[]> {
  return loadRequests();
}

/**
 * Saves a request collection directly to storage.
 *
 * @param requests Request collection to persist
 */
export async function saveRequests(requests: WalletRequest[]): Promise<void> {
  await persistRequests(requests);
}

/**
 * Rebuilds derived requests from the current credentials and merges them with
 * existing stored request history.
 *
 * This is the main synchronisation entry point used when credential state has
 * changed and requests need to be refreshed.
 *
 * @param credentials Current frontend credential list
 * @returns Updated merged request collection
 */
export async function syncRequestsFromCredentials(
  credentials: FrontendCredential[]
): Promise<WalletRequest[]> {
  const existing = await loadRequests();
  const derived = buildDerivedRequests(credentials);
  const merged = mergeDerivedWithExisting(existing, derived);

  await persistRequests(merged);
  return merged;
}

/**
 * Counts the number of currently pending requests.
 *
 * @returns Number of requests in the pending bucket
 */
export async function getPendingRequestsCount(): Promise<number> {
  const requests = await loadRequests();
  return requests.filter((request) => request.type === "pending").length;
}

/**
 * Marks a request as read while keeping the rest of the request data unchanged.
 *
 * @param requestId Request identifier
 */
export async function markRequestAsRead(requestId: string): Promise<void> {
  await updateRequestCollection((requests) =>
    updateRequestById(requests, requestId, (request) => ({
      ...request,
      isRead: true,
    }))
  );
}

/**
 * Marks a request as completed and moves it into the past/history bucket.
 *
 * The request is also visually updated to reflect a completed success state.
 *
 * @param requestId Request identifier
 */
export async function completeRequest(requestId: string): Promise<void> {
  await updateRequestCollection((requests) =>
    updateRequestById(requests, requestId, (request) => ({
      ...request,
      type: "past",
      status: "completed",
      statusLabel: "Completed",
      statusColour: "#22C55E",
      icon: "checkmark-done-outline",
      updatedAt: new Date().toISOString(),
      isRead: true,
    }))
  );
}

/**
 * Builds the short relative time label used for displaying request recency in
 * the UI.
 *
 * @param request Wallet request
 * @returns Human-readable time label based on updatedAt
 */
export function getRequestTimeLabel(request: WalletRequest): string {
  return formatRelativeTime(request.updatedAt);
}