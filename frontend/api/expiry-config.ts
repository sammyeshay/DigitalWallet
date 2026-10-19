import { FrontendCredential } from "./credentials";

/**
 * Number of days before expiry that a credential should be treated as
 * "expiring soon".
 *
 * This value is used by request generation, notification logic, and any
 * frontend messaging that needs a consistent threshold.
 */
export const EXPIRING_SOON_DAYS = 30;

/**
 * Represents the interpreted expiry state of a credential.
 *
 * - valid: credential has a usable expiry date and is not near expiry
 * - expiring: credential is within the "expiring soon" threshold
 * - expired: credential expiry date is in the past
 * - missing: no expiry date could be found
 * - invalid: an expiry-like value exists but cannot be parsed as a valid date
 */
export type ExpiryState =
  | "valid"
  | "expiring"
  | "expired"
  | "missing"
  | "invalid";

/**
 * A flexible credential shape used by expiry utilities.
 *
 * We start with the frontend credential model, but allow additional unknown
 * fields because expiry data may live in nested raw payloads that are not
 * strongly typed at compile time.
 */
export type ExpiryAwareCredential = Partial<FrontendCredential> &
  Record<string, unknown>;

/**
 * Normalises a status string so comparisons are safe and consistent.
 *
 * This avoids repeated trimming/lowercasing throughout the codebase and makes
 * status checks like "revoked", "expired", or "pending" more reliable.
 *
 * @param status Raw credential status value
 * @returns Lowercased and trimmed status string, or an empty string
 */
export function normaliseStatus(status?: string): string {
  return String(status ?? "").trim().toLowerCase();
}

/**
 * Checks whether a credential id is present and usable.
 *
 * This is helpful before building stable ids for notifications, requests, or
 * storage keys.
 *
 * @param value Potential credential id
 * @returns True when the value is a non-empty string
 */
export function isUsableCredentialId(value?: string): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Safely returns a displayable credential title.
 *
 * If the credential is missing a title or the title is blank, a fallback label
 * is returned so UI copy and notifications remain readable.
 *
 * @param credential Partial credential object
 * @returns A trimmed title or the fallback string "Credential"
 */
export function getSafeCredentialTitle(
  credential: Partial<FrontendCredential>
): string {
  const title = credential.title;
  return typeof title === "string" && title.trim().length > 0
    ? title.trim()
    : "Credential";
}

/**
 * Attempts to locate an expiry date from a credential across multiple possible
 * field locations.
 *
 * Different issuers and credential payloads may place expiry information in
 * different places. This helper centralises that lookup order so the rest of
 * the app has one consistent source of truth.
 *
 * Checked locations include:
 * - top-level frontend fields
 * - raw credential payload
 * - parsed document
 * - parsed credential subject
 *
 * @param credential Credential object that may contain expiry data
 * @returns The first non-empty expiry date string found, or undefined
 */
export function getExpiryDateValue(
  credential: ExpiryAwareCredential
): string | undefined {
  const raw = credential.raw as Record<string, any> | undefined;
  const parsedDocument = raw?.parsedDocument as Record<string, any> | undefined;
  const credentialSubject = parsedDocument?.credentialSubject as
    | Record<string, any>
    | undefined;

  const candidates = [
    credential.validUntil,
    credential.expiryDate,
    raw?.validUntil,
    raw?.expiryDate,
    parsedDocument?.validUntil,
    parsedDocument?.expiryDate,
    credentialSubject?.validUntil,
    credentialSubject?.expiryDate,
  ];

  return candidates.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  );
}

/**
 * Calculates how many whole days remain until a given date.
 *
 * The calculation compares dates at day level rather than exact timestamps,
 * which avoids partial-day issues caused by hours, minutes, or timezone noise.
 *
 * Examples:
 * - today -> 0
 * - tomorrow -> 1
 * - yesterday -> -1
 *
 * @param dateString Date string to evaluate
 * @returns Number of days until the target date, or null if invalid/missing
 */
export function getDaysUntilDate(dateString?: string): number | null {
  if (!dateString) return null;

  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const diffMs = startOfTarget.getTime() - startOfToday.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Derives the expiry state for a credential.
 *
 * This helper is the main decision point for expiry-related workflows.
 * It determines whether a credential is:
 * - missing expiry information
 * - invalid
 * - expired
 * - expiring soon
 * - still valid
 *
 * Note:
 * Revoked credentials are intentionally treated as "valid" for expiry purposes
 * so they do not also trigger expiry-based flows. Revocation is handled as a
 * separate lifecycle concern elsewhere.
 *
 * @param credential Credential to assess
 * @returns Interpreted expiry state
 */
export function getExpiryState(
  credential: ExpiryAwareCredential
): ExpiryState {
  const status = normaliseStatus(credential.status);

  // Revoked credentials should not also produce expiry workflows.
  if (status === "revoked") {
    return "valid";
  }

  const expiryDateValue = getExpiryDateValue(credential);
  if (!expiryDateValue) return "missing";

  const daysUntilExpiry = getDaysUntilDate(expiryDateValue);
  if (daysUntilExpiry === null) return "invalid";
  if (daysUntilExpiry < 0) return "expired";

  return daysUntilExpiry <= EXPIRING_SOON_DAYS ? "expiring" : "valid";
}

/**
 * Builds a stable identifier for one specific expiry cycle of a credential.
 *
 * This is useful for preventing duplicate notifications or duplicate request
 * records when the same credential is evaluated repeatedly.
 *
 * The expiry date is normalised to ISO format so equivalent dates generate the
 * same id consistently.
 *
 * @param credential Credential containing a credential id
 * @param expiryDate Raw expiry date string
 * @returns Stable expiry-cycle id, or null if inputs are unusable
 */
export function getExpiryCycleId(
  credential: Pick<FrontendCredential, "credential_id">,
  expiryDate: string
): string | null {
  if (!isUsableCredentialId(credential.credential_id)) {
    return null;
  }

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    return null;
  }

  return `expiry-${credential.credential_id}-${expiry.toISOString()}`;
}

/**
 * Returns user-facing short-form time remaining text for expiry messaging.
 *
 * This is intended for compact labels, badges, or notification metadata.
 *
 * @param daysUntilExpiry Number of days until expiry
 * @returns Human-readable expiry timing label
 */
export function getExpiryTimeRemainingLabel(daysUntilExpiry: number): string {
  if (daysUntilExpiry <= 0) {
    return "Expires today";
  }

  if (daysUntilExpiry === 1) {
    return "Expires in 24 hours";
  }

  return `Expires in ${daysUntilExpiry} days`;
}

/**
 * Builds the main action-oriented expiry message shown to the user.
 *
 * This is used in places such as notifications, request cards, or prompts where
 * the user needs a clear nudge to review and renew a credential.
 *
 * @param credentialTitle Display title of the credential
 * @param daysUntilExpiry Number of days until expiry
 * @returns User-facing action text
 */
export function buildExpiryActionText(
  credentialTitle: string,
  daysUntilExpiry: number
): string {
  if (daysUntilExpiry === 0) {
    return `Your ${credentialTitle} expires today. Review and renew to avoid interruption.`;
  }

  if (daysUntilExpiry === 1) {
    return `Your ${credentialTitle} expires in 24 hours. Review and renew to avoid interruption.`;
  }

  return `Your ${credentialTitle} expires in ${daysUntilExpiry} days. Review and renew to avoid interruption.`;
}