import { Ionicons } from "@expo/vector-icons";
import { WalletActivity } from "../../api/activity";

export function formatActivityAction(
  actionType: WalletActivity["actionType"]
): string {
  switch (actionType) {
    case "credential_presented":
      return "Credential presented";
    case "verification_success":
      return "Verification successful";
    case "verification_failure":
      return "Verification failed";
    case "status_changed":
      return "Status changed";
    case "credential_expired":
      return "Credential expired";
    case "credential_revoked":
      return "Credential revoked";
    case "credential_updated":
      return "Credential updated";
    default:
      return "Activity recorded";
  }
}

export function getActivityIconName(
  actionType: WalletActivity["actionType"]
): keyof typeof Ionicons.glyphMap {
  switch (actionType) {
    case "credential_presented":
      return "share-social-outline";
    case "verification_success":
      return "checkmark-done-outline";
    case "verification_failure":
      return "close-circle-outline";
    case "status_changed":
      return "swap-horizontal-outline";
    case "credential_expired":
      return "time-outline";
    case "credential_revoked":
      return "ban-outline";
    case "credential_updated":
      return "create-outline";
    default:
      return "document-text-outline";
  }
}

export function getActivityAccentColour(
  actionType: WalletActivity["actionType"]
): string {
  switch (actionType) {
    case "verification_success":
      return "#16A34A";
    case "verification_failure":
    case "credential_revoked":
      return "#DC2626";
    case "credential_expired":
      return "#B45309";
    case "credential_presented":
      return "#4E6CF6";
    case "status_changed":
    case "credential_updated":
      return "#7C3AED";
    default:
      return "#5B6FF5";
  }
}

export function formatActivityTimeLabel(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isDisplayableActivity(
  activity: WalletActivity | null | undefined
): activity is WalletActivity {
  return Boolean(
    activity &&
      typeof activity.id === "string" &&
      activity.id.trim() &&
      typeof activity.credentialTitle === "string" &&
      activity.credentialTitle.trim() &&
      typeof activity.credentialId === "string" &&
      activity.credentialId.trim() &&
      typeof activity.actionType === "string" &&
      typeof activity.timestamp === "string"
  );
}