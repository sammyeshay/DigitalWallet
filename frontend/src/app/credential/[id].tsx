import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  fetchCredentialById,
  STATUS_META,
} from "../../../api/credentials";
import { unhashDisclosures } from "../add-credential";
import { styles } from "../../styles/CredentialStyles";

/**
 * Normalised credential detail structure used by this screen.
 *
 * This screen reads a single credential by id, then renders:
 * - summary information
 * - core credential subject fields
 * - privacy-protected disclosure fields
 *
 * Some values may exist in multiple places depending on how the credential
 * was normalised upstream, so helper functions below safely resolve them.
 */
type CredentialDetail = {
  credential_id: string;
  validUntil?: string;
  expiryDate?: string;
  title: string;
  issuer: string;
  status: string;
  offerLink: string;
  credentialSubject?: Record<string, any>;
  raw?: any;
  disclosures?: string;
  cdDisclosures?: string;
};

/**
 * Number of days before expiry that should be treated as "expiring soon".
 *
 * This is used only for visual messaging on the detail screen.
 */
const EXPIRING_SOON_DAYS = 30;

/**
 * Supported expiry states for a credential.
 *
 * - valid: expiry is present and not close
 * - expiring: expiry is within the warning window
 * - expired: expiry has passed or status is explicitly expired
 * - missing: no expiry date could be found
 * - invalid: expiry date exists but cannot be parsed
 */
type ExpiryState = "valid" | "expiring" | "expired" | "missing" | "invalid";

/**
 * Resolves the best available expiry value from the credential.
 *
 * Credential data may be stored in multiple possible fields depending on
 * source shape and normalisation. This helper checks likely candidates
 * in priority order and returns the first usable non-empty string.
 *
 * @param credential The credential detail object
 * @returns Expiry date string if found, otherwise undefined
 */
function getExpiryDateValue(
  credential: CredentialDetail & Record<string, any>
): string | undefined {
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
 * Determines the credential's expiry state for UI display.
 *
 * Behaviour:
 * - revoked credentials are treated separately from expiry, so they do not
 *   show an expiry warning state here
 * - explicitly expired credentials always return "expired"
 * - missing or invalid dates fall back to their own states
 * - dates within the threshold return "expiring"
 *
 * @param credential The credential detail object
 * @returns ExpiryState used for banners and styling
 */
function getExpiryState(
  credential: CredentialDetail & Record<string, any>
): ExpiryState {
  const lowerStatus = String(credential.status ?? "").trim().toLowerCase();

  if (lowerStatus === "revoked") {
    return "valid";
  }

  if (lowerStatus === "expired") {
    return "expired";
  }

  const expiryValue = getExpiryDateValue(credential);
  if (!expiryValue) {
    return "missing";
  }

  const expiryDate = new Date(expiryValue);
  if (Number.isNaN(expiryDate.getTime())) {
    return "invalid";
  }

  const now = new Date();
  const msUntilExpiry = expiryDate.getTime() - now.getTime();

  if (msUntilExpiry < 0) {
    return "expired";
  }

  const daysUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24);
  return daysUntilExpiry <= EXPIRING_SOON_DAYS ? "expiring" : "valid";
}

/**
 * Returns banner styling and text for the current expiry state.
 *
 * Only "expiring" and "expired" produce banners. Other states return null
 * so no banner is rendered.
 *
 * @param expiryState Derived expiry state
 * @returns Banner configuration or null
 */
function getExpiryBanner(expiryState: ExpiryState): {
  label: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
} | null {
  switch (expiryState) {
    case "expiring":
      return {
        label: "Expiring soon",
        backgroundColor: "#FEF3C7",
        borderColor: "#F59E0B",
        textColor: "#B45309",
      };
    case "expired":
      return {
        label: "Expired",
        backgroundColor: "#FEE2E2",
        borderColor: "#EF4444",
        textColor: "#B91C1C",
      };
    default:
      return null;
  }
}

/**
 * Formats an ISO-like expiry value into a user-friendly Australian date.
 *
 * @param value Raw expiry date string
 * @returns Formatted date or fallback label
 */
function formatExpiryDate(value?: string): string {
  if (!value) return "Not available";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Invalid expiry date";
  }

  return parsed.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Converts a raw object key into a readable UI label.
 *
 * Example:
 * - directorId -> Director Id
 * - appointmentDate -> Appointment Date
 *
 * @param key Raw field name
 * @returns Human-readable label
 */
function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

/**
 * Normalises a credential status string for display.
 *
 * @param status Raw status
 * @returns Capitalised fallback-safe status label
 */
function formatStatusLabel(status: string): string {
  const trimmed = String(status ?? "").trim();
  if (!trimmed) return "Unknown";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * CredentialDetailScreen
 *
 * Displays a single credential in a redesigned, privacy-conscious layout.
 *
 * Responsibilities:
 * - read the credential id from route params
 * - fetch the credential detail record
 * - render loading, error, and success states safely
 * - show summary metadata such as title, issuer, status, and expiry warnings
 * - show standard credential fields in a prominent, centred layout
 * - show privacy-protected fields inside a collapsible section
 *
 * This screen intentionally avoids presentation or selective-share controls.
 * Its purpose is inspection and review only.
 *
 * @returns React Native credential detail screen
 */
export default function CredentialDetailScreen() {
  /**
   * Route params may arrive as a string or array depending on navigation shape.
   * Normalise to a single string credential id where possible.
   */
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const credentialId = Array.isArray(rawId) ? rawId[0] : rawId;

  /**
   * Loaded credential state.
   */
  const [credential, setCredential] = useState<CredentialDetail | null>(null);

  /**
   * Loading flag while fetching credential data.
   */
  const [loading, setLoading] = useState(true);

  /**
   * User-facing error state when the credential cannot be loaded.
   */
  const [error, setError] = useState("");

  /**
   * Controls whether the privacy-protected disclosure fields are expanded.
   */
  const [privacyExpanded, setPrivacyExpanded] = useState(false);

  /**
   * Loads the credential whenever the route id changes.
   *
   * Workflow:
   * - validate the incoming credential id
   * - fetch the credential
   * - normalise disclosure and credentialSubject fields for local use
   * - surface a stable fallback error if anything fails
   */
  useEffect(() => {
    const loadCredential = async () => {
      if (!credentialId || typeof credentialId !== "string") {
        setCredential(null);
        setError("Missing credential ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setCredential(null);

        const normalised = await fetchCredentialById(credentialId);
        const raw = normalised.raw;

        setCredential({
          ...normalised,
          cdDisclosures: normalised.disclosures,
          credentialSubject: raw?.parsedDocument?.credentialSubject ?? {},
          raw,
        });
      } catch (err) {
        console.error("Failed to load credential details:", err);
        setCredential(null);
        setError(
          "This credential could not be found. It may have been removed or is no longer available."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCredential();
  }, [credentialId]);

  /**
   * Parses hashed disclosure strings into readable key/value pairs.
   *
   * These fields are treated as privacy-protected details and rendered in
   * a collapsible section below the main credential information.
   */
  const disclosureEntries = useMemo(() => {
    if (!credential) return [];
    const parsedDisclosures = unhashDisclosures(credential.cdDisclosures ?? "");
    return Object.entries(parsedDisclosures ?? {}).map(([key, value]) => ({
      key,
      value,
    }));
  }, [credential]);

  /**
   * Loading state.
   */
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <LinearGradient
          colors={["#285CD4", "#3652DA", "#7253D4", "#B971B5"]}
          locations={[0, 0.28, 0.72, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.detailsLoadingText}>Loading credential...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  /**
   * Error or missing credential state.
   */
  if (error || !credential) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <LinearGradient
          colors={["#285CD4", "#3652DA", "#7253D4", "#B971B5"]}
          locations={[0, 0.28, 0.72, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.errorScreen}>
            <View style={styles.errorCard}>
              <View style={styles.errorIconWrap}>
                <Ionicons
                  name="alert-circle-outline"
                  size={34}
                  color="#B42318"
                />
              </View>

              <Text style={styles.errorTitle}>Credential not found</Text>
              <Text style={styles.errorBody}>
                {error || "This credential is no longer available."}
              </Text>

              <Pressable
                style={styles.primaryButton}
                onPress={() => router.replace("/(tabs)/credentials")}
              >
                <Text style={styles.primaryButtonText}>Back to Credentials</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  /**
   * Derived values used by the success state UI.
   */
  const lowerStatus = String(credential.status).trim().toLowerCase();
  const statusMeta = STATUS_META[lowerStatus] ?? STATUS_META.issued;
  const expiryValue = getExpiryDateValue(credential);
  const expiryState = getExpiryState(credential);
  const expiryBanner = getExpiryBanner(expiryState);

  /**
   * Standard credential subject fields shown in the main details card.
   *
   * The internal `_sd` marker is filtered out because it is not user-facing.
   */
  const visibleCredentialFields = Object.entries(
    credential.credentialSubject ?? {}
  ).filter(([key]) => key !== "_sd");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={["#285CD4", "#3652DA", "#7253D4", "#B971B5"]}
        locations={[0, 0.28, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.detailsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 
            Custom in-screen header.
            This is separate from the native stack header and keeps the screen
            visually aligned with the newer flow screens.
          */}
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.headerTitle}>Credential Details</Text>
          </View>

          {/* 
            Summary card containing the credential title, issuer, status pill,
            and any applicable expiry messaging.
          */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{credential.title}</Text>
            <Text style={styles.summaryIssuer}>Issued by {credential.issuer}</Text>

            <View
              style={[
                styles.detailsStatusPill,
                { backgroundColor: statusMeta.bg },
              ]}
            >
              <View
                style={[
                  styles.detailsStatusDot,
                  { backgroundColor: statusMeta.dot },
                ]}
              />
              <Text
                style={[
                  styles.detailsStatusText,
                  { color: statusMeta.color },
                ]}
              >
                {formatStatusLabel(credential.status)}
              </Text>
            </View>

            {expiryBanner ? (
              <View
                style={[
                  styles.expiryBanner,
                  {
                    backgroundColor: expiryBanner.backgroundColor,
                    borderColor: expiryBanner.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.expiryBannerTitle,
                    { color: expiryBanner.textColor },
                  ]}
                >
                  {expiryBanner.label}
                </Text>
                <Text style={styles.expiryBannerText}>
                  Expiry date: {formatExpiryDate(expiryValue)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* 
            Main credential details section.
            Values are centred and emphasised to make the content easier to scan.
          */}
          {visibleCredentialFields.length > 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionEyebrow}>Credential details</Text>

              {visibleCredentialFields.map(([key, value], index, arr) => (
                <View
                  key={key}
                  style={[
                    styles.detailRow,
                    index < arr.length - 1 && styles.detailRowBorder,
                  ]}
                >
                  <Text style={styles.detailLabelCentered}>{formatLabel(key)}</Text>
                  <Text style={styles.detailValueCentered}>{String(value)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* 
            Privacy-protected section.
            Disclosure fields remain hidden by default and can be revealed by
            expanding the section.
          */}
          <View style={styles.sectionCard}>
            <Pressable
              style={styles.privacyHeader}
              onPress={() => setPrivacyExpanded((prev) => !prev)}
            >
              <View style={styles.privacyHeaderTextWrap}>
                <Text style={styles.sectionEyebrow}>Privacy protected fields</Text>
                <Text style={styles.privacyHint}>
                  Tap to {privacyExpanded ? "hide" : "view"} sensitive details
                </Text>
              </View>

              <Ionicons
                name={privacyExpanded ? "chevron-up" : "chevron-down"}
                size={22}
                color="#6B7280"
              />
            </Pressable>

            {privacyExpanded ? (
              disclosureEntries.length === 0 ? (
                <Text style={styles.emptyDisclosureText}>
                  There are no privacy-protected fields available for this credential.
                </Text>
              ) : (
                disclosureEntries.map(({ key, value }, index) => {
                  const isLast = index === disclosureEntries.length - 1;

                  return (
                    <View
                      key={key}
                      style={[
                        styles.privacyRow,
                        !isLast && styles.detailRowBorder,
                      ]}
                    >
                      <Text style={styles.privacyLabel}>{formatLabel(key)}</Text>
                      <Text style={styles.privacyValue}>{String(value)}</Text>
                    </View>
                  );
                })
              )
            ) : null }
          </View>

          {/* 
            Secondary exit action.
            Keeps navigation behaviour simple and consistent with the updated flow
            screens.
          */}
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
