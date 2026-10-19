import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { FrontendCredential } from "./credentials";
import {
  buildExpiryActionText,
  getDaysUntilDate,
  getExpiryCycleId,
  getExpiryDateValue,
  getExpiryState,
  getExpiryTimeRemainingLabel,
  getSafeCredentialTitle,
  isUsableCredentialId,
  normaliseStatus,
} from "./expiry-config";

/**
 * Storage key used to persist which expiry notifications have already been sent.
 *
 * This prevents duplicate notifications for the same credential expiry cycle.
 */
const EXPIRY_NOTIFICATION_STORAGE_KEY = "expiry_notification_history_v1";

/**
 * Maps a unique expiry cycle id → timestamp when notification was sent.
 *
 * Example:
 * {
 *   "expiry-credential123-2026-05-01T00:00:00.000Z": "2026-04-01T10:00:00.000Z"
 * }
 */
type NotificationHistory = Record<string, string>;

/**
 * Loads the notification history from AsyncStorage.
 *
 * This is used to ensure we do not send duplicate notifications for the same
 * credential expiry event.
 *
 * @returns Stored notification history map
 */
async function getNotificationHistory(): Promise<NotificationHistory> {
  const raw = await AsyncStorage.getItem(EXPIRY_NOTIFICATION_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    // If parsing fails, treat as empty history rather than crashing
    return {};
  }
}

/**
 * Persists the notification history to AsyncStorage.
 *
 * @param history Updated notification history map
 */
async function saveNotificationHistory(
  history: NotificationHistory
): Promise<void> {
  await AsyncStorage.setItem(
    EXPIRY_NOTIFICATION_STORAGE_KEY,
    JSON.stringify(history)
  );
}

/**
 * Determines whether a credential should trigger an expiry notification.
 *
 * This function centralises all business rules for notification eligibility.
 *
 * Rules:
 * - revoked and expired credentials are ignored
 * - credential must have a valid id
 * - credential must be in "expiring" state
 * - expiry date must be valid and in the future
 * - expiry cycle id must be derivable
 *
 * @param credential Credential to evaluate
 * @returns Object describing whether to notify and required metadata
 */
function shouldNotifyForExpiry(credential: FrontendCredential): {
  shouldNotify: boolean;
  expiryDate?: string;
  daysUntilExpiry?: number;
  cycleId?: string;
} {
  const status = normaliseStatus(credential.status);

  // Skip revoked or already expired credentials
  if (status === "revoked" || status === "expired") {
    return { shouldNotify: false };
  }

  // Skip if credential id is invalid (cannot safely track notification)
  if (!isUsableCredentialId(credential.credential_id)) {
    return { shouldNotify: false };
  }
  console.log("[expiry-debug] credential", {
    id: credential.credential_id,
    title: credential.title,
    status: credential.status,
    validUntil: credential.validUntil,
    expiryDate: credential.expiryDate,
    rawValidUntil: credential.raw?.validUntil,
    rawExpiryDate: credential.raw?.expiryDate,
    parsedValidUntil: credential.raw?.parsedDocument?.validUntil,
    parsedExpiryDate: credential.raw?.parsedDocument?.expiryDate,
    subjectValidUntil:
      credential.raw?.parsedDocument?.credentialSubject?.validUntil,
    subjectExpiryDate:
      credential.raw?.parsedDocument?.credentialSubject?.expiryDate,
    resolvedExpiryDate: getExpiryDateValue(credential),
    expiryState: getExpiryState(credential),
  });

  // Only notify if credential is within the "expiring soon" window
  if (getExpiryState(credential) !== "expiring") {
    return { shouldNotify: false };
  }

  const expiryDate = getExpiryDateValue(credential);
  if (!expiryDate) {
    return { shouldNotify: false };
  }


  const daysUntilExpiry = getDaysUntilDate(expiryDate);
  if (daysUntilExpiry === null || daysUntilExpiry < 0) {
    return { shouldNotify: false };
  }

  const cycleId = getExpiryCycleId(credential, expiryDate);
  if (!cycleId) {
    return { shouldNotify: false };
  }
  console.log("[expiry-debug] evaluation", {
    id: credential.credential_id,
    resolvedExpiryDate: expiryDate,
    daysUntilExpiry,
    cycleId,
  });

  return {
    shouldNotify: true,
    expiryDate,
    daysUntilExpiry,
    cycleId,
  };
}

/**
 * Ensures the app has permission to send notifications.
 *
 * If permission has not yet been granted, it will request it from the user.
 *
 * @returns True if permission is granted, false otherwise
 */
export async function registerForExpiryNotifications(): Promise<boolean> {
  try {
    const permissions = await Notifications.getPermissionsAsync();

    let finalStatus = permissions.status;

    // Request permission if not already granted
    if (finalStatus !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("[expiry-notification] permission check failed", error);
    return false;
  }
}

/**
 * Triggers expiry notifications for a list of credentials.
 *
 * Workflow:
 * 1. Validate input
 * 2. Ensure notification permissions
 * 3. Load notification history
 * 4. Evaluate each credential for expiry eligibility
 * 5. Skip already-notified expiry cycles
 * 6. Send notification and record it in history
 *
 * Safeguards:
 * - Prevents duplicate notifications via cycleId tracking
 * - Handles malformed credentials gracefully
 * - Skips invalid or incomplete data
 *
 * @param credentials List of credentials to evaluate
 */
export async function triggerExpiryNotifications(
  credentials: FrontendCredential[]
): Promise<void> {
  // Guard: nothing to process
  if (!Array.isArray(credentials) || credentials.length === 0) {
    return;
  }

  // Ensure we have permission to send notifications
  const hasPermission = await registerForExpiryNotifications();
  if (!hasPermission) {
    return;
  }

  // Load history to prevent duplicate notifications
  const history = await getNotificationHistory();
  let hasChanges = false;

  for (const credential of credentials) {
    try {
      const evaluation = shouldNotifyForExpiry(credential);

      // Skip credentials that do not meet notification criteria
      if (!evaluation.shouldNotify) {
        continue;
      }

      const {
        expiryDate,
        daysUntilExpiry,
        cycleId,
      } = evaluation;

      // Defensive guard: ensure all required values are present
      if (!expiryDate || daysUntilExpiry === undefined || !cycleId) {
        continue;
      }

      // Skip if notification for this expiry cycle has already been sent
      if (history[cycleId]) {
        continue;
      }

      const credentialTitle = getSafeCredentialTitle(credential);

      // Build user-facing notification message
      const body = buildExpiryActionText(credentialTitle, daysUntilExpiry);

      // Trigger local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Credential expiring soon",
          body,
          data: {
            credentialId: credential.credential_id,
            screen: "credential-detail",
            credentialTitle,
            expiryDate,
            timeRemaining: getExpiryTimeRemainingLabel(daysUntilExpiry),
          },
        },
        trigger: null, // Immediate notification
      });

      // Record that this expiry cycle has been notified
      history[cycleId] = new Date().toISOString();
      hasChanges = true;
    } catch (error) {
      // Log and continue processing other credentials
      console.error("[expiry-notification] skipped invalid credential", {
        credentialId: credential?.credential_id,
        error,
      });
    }
  }

  // Persist updated history only if new notifications were sent
  if (hasChanges) {
    await saveNotificationHistory(history);
  }
}