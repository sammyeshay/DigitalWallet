import { FrontendCredential } from "../../api/credentials";

/**
 * List of statuses considered "healthy" or valid for a credential.
 *
 * These represent credentials that are usable and should not trigger
 * warnings or alerts in the UI.
 */
const HEALTHY_STATUSES = ["valid", "approved", "accepted", "issued", "active"];

/**
 * Threshold (in days) for when a credential should be considered
 * "expiring soon".
 */
export const EXPIRING_SOON_DAYS = 30;

/**
 * Represents the computed expiry state of a credential.
 *
 * - valid: credential is healthy and not near expiry
 * - expiring: within EXPIRING_SOON_DAYS threshold
 * - expired: expiry date has passed
 * - missing: no expiry information available
 * - invalid: expiry date exists but cannot be parsed
 */
export type ExpiryState =
  | "valid"
  | "expiring"
  | "expired"
  | "missing"
  | "invalid";

/**
 * Normalises a credential status string for consistent comparisons.
 *
 * Behaviour:
 * - converts undefined/null to empty string
 * - trims whitespace
 * - lowercases the value
 *
 * @param status Raw credential status
 * @returns Normalised status string
 */
export function normaliseStatus(status?: string): string {
  return String(status || "").trim().toLowerCase();
}

/**
 * Determines whether a credential status is considered "healthy".
 *
 * @param status Raw credential status
 * @returns true if the status is in the healthy status list
 */
export function isHealthyStatus(status?: string): boolean {
  return HEALTHY_STATUSES.includes(normaliseStatus(status));
}

/**
 * Counts how many credentials are currently in a "pending" state.
 *
 * Useful for:
 * - badge counts
 * - notifications
 * - request tracking UI
 *
 * @param credentials List of credentials
 * @returns Number of pending credentials
 */
export function countPendingRequests(
  credentials: FrontendCredential[]
): number {
  return credentials.filter(
    (credential) => normaliseStatus(credential.status) === "pending"
  ).length;
}

/**
 * Determines whether all credentials in the list are valid/healthy.
 *
 * Returns false if:
 * - the list is empty (no credentials to validate)
 * - any credential is not in a healthy status
 *
 * @param credentials List of credentials
 * @returns true if all credentials are healthy
 */
export function areAllCredentialsValid(
  credentials: FrontendCredential[]
): boolean {
  return (
    credentials.length > 0 &&
    credentials.every((credential) => isHealthyStatus(credential.status))
  );
}

/**
 * Attempts to extract an expiry date string from a credential object.
 *
 * Because credential formats can vary, multiple possible fields are checked
 * in priority order, including nested structures from parsed documents.
 *
 * Supported locations:
 * - top-level fields (validUntil, expiryDate)
 * - raw credential object
 * - parsedDocument fields
 * - credentialSubject fields
 *
 * @param credential Credential object (possibly partial or loosely typed)
 * @returns First valid expiry date string found, or undefined if none exists
 */
export function getExpiryDateValue(
  credential?: Partial<FrontendCredential> & Record<string, any>
): string | undefined {
  if (!credential) return undefined;

  const candidates = [
    credential.validUntil,
    credential.expiryDate,
    credential.raw?.validUntil,
    credential.raw?.expiryDate,
    credential.raw?.parsedDocument?.validUntil,
    credential.raw?.parsedDocument?.expiryDate,
    credential.raw?.parsedDocument?.credentialSubject?.validUntil,
    credential.raw?.parsedDocument?.credentialSubject?.expiryDate,
  ];

  return candidates.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  );
}

/**
 * Computes the expiry state of a credential.
 *
 * Logic flow:
 * 1. Handle missing credential
 * 2. Ignore revoked credentials for expiry workflows
 * 3. Attempt to extract expiry date
 * 4. Validate date format
 * 5. Compare against current time
 * 6. Determine if expired, expiring soon, or valid
 *
 * @param credential Credential object (partial allowed)
 * @returns ExpiryState representing the credential’s lifecycle stage
 */
export function getExpiryState(
  credential?: Partial<FrontendCredential> & Record<string, any>
): ExpiryState {
  // No credential provided → cannot determine expiry
  if (!credential) return "missing";

  const lowerStatus = normaliseStatus(credential.status);

  /**
   * Revoked credentials are excluded from expiry workflows.
   *
   * They are treated as "valid" here to prevent triggering expiry alerts
   * or UI warnings that are not relevant once revoked.
   */
  if (lowerStatus === "revoked") {
    return "valid";
  }

  // Attempt to extract expiry date from possible fields
  const expiryValue = getExpiryDateValue(credential);
  if (!expiryValue) {
    return "missing";
  }

  // Parse expiry date
  const expiryDate = new Date(expiryValue);
  if (Number.isNaN(expiryDate.getTime())) {
    return "invalid";
  }

  const now = new Date();
  const msUntilExpiry = expiryDate.getTime() - now.getTime();

  // Expiry date has passed
  if (msUntilExpiry < 0) {
    return "expired";
  }

  // Convert milliseconds to days for comparison
  const daysUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24);

  /**
   * Determine if credential is approaching expiry based on threshold.
   */
  return daysUntilExpiry <= EXPIRING_SOON_DAYS ? "expiring" : "valid";
}