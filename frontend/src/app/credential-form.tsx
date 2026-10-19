import { useMemo, useState } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  acceptCredential,
  fetchCredentials,
  isDuplicateCredential,
} from "../../api/credentials";

import { credentialFlowStyles as styles } from "../styles/credentialFlow";
import { tokens } from "../styles/tokens";
import { uiSystem } from "../styles/uiSystem";

/**
 * Converts a camelCase or PascalCase field key into a more readable label for UI display.
 *
 * Examples:
 * - "givenName" -> "Given Name"
 * - "directorId" -> "Director Id"
 *
 * @param key Raw object key
 * @returns Human-readable label string
 */
function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

/**
 * Formats credential type strings into a more readable display label.
 *
 * @param type Raw type string
 * @returns Nicely formatted credential type
 */
function formatCredentialType(type?: string): string {
  if (!type) return "To be confirmed after acceptance";

  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\bId\b/g, "ID")
    .replace(/\bUbo\b/g, "UBO")
    .replace(/\bAml\b/g, "AML")
    .trim();
}

/**
 * Performs a lightweight check to determine whether a value looks like a
 * credential offer link.
 *
 * This is used as an early guard before attempting to accept a credential.
 * It does not fully validate the issuer or payload, but helps catch clearly
 * invalid input.
 *
 * @param value Potential credential offer link
 * @returns True if the value resembles a supported offer link
 */
function isLikelyOfferLink(value: string): boolean {
  const trimmed = value.trim().toLowerCase();

  return (
    trimmed.startsWith("openid-credential-offer://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  );
}

/**
 * CredentialFormScreen displays a preview of the credential offer detected
 * from a scan or deep link flow before the user formally accepts it.
 *
 * Responsibilities:
 * - read preview data passed via route params
 * - display high-level credential summary
 * - display expandable credential details and attributes
 * - validate acceptance preconditions
 * - prevent duplicates from being added to the wallet
 * - accept the pending credential and route to the success screen
 *
 * @returns React Native screen for credential confirmation
 */
export default function CredentialFormScreen() {
  /**
   * Route parameters provided by the previous scan/link step.
   *
   * These values are used to populate the confirmation UI before the credential
   * is fully accepted into the wallet.
   */
  const {
    offerLink,
    credentialId,
    credentialName,
    issuer,
    status,
    credentialType,
    credentialSubject,
    sdDisclosures,
  } = useLocalSearchParams<{
    offerLink?: string;
    credentialId?: string;
    credentialName?: string;
    issuer?: string;
    status?: string;
    credentialType?: string;
    credentialSubject?: string;
    sdDisclosures?: string;
  }>();

  /**
   * Tracks whether the credential acceptance request is currently in progress.
   *
   * Used to disable repeat submissions and update button text.
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Controls whether the "Credential Details" section is expanded.
   *
   * Closed by default so the screen feels lighter on first load.
   */
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  /**
   * Controls whether the "Attributes" section is expanded.
   *
   * Closed by default so the screen feels lighter on first load.
   */
  const [attributesExpanded, setAttributesExpanded] = useState(false);

  /**
   * Safely parses the credentialSubject JSON passed via route params.
   *
   * Falls back to an empty object if the value is missing or malformed so the
   * screen can still render safely.
   */
  const parsedCredentialSubject = useMemo<Record<string, unknown>>(() => {
    try {
      return credentialSubject ? JSON.parse(credentialSubject) : {};
    } catch {
      return {};
    }
  }, [credentialSubject]);

  /**
   * Safely parses SD disclosure data passed via route params.
   *
   * These are merged with the standard credential subject values for display in
   * the attributes section.
   */
  const parsedSdDisclosures = useMemo<Record<string, unknown>>(() => {
    try {
      return sdDisclosures ? JSON.parse(sdDisclosures) : {};
    } catch {
      return {};
    }
  }, [sdDisclosures]);

  /**
   * Fallback-friendly display values used throughout the screen.
   */
  const displayTitle = credentialName || "Credential Offer";
  const displayIssuer =
    issuer || "Issuer details will be confirmed after acceptance";
  const displayStatus = status || "Pending";

  /**
   * Placeholder values for issue and expiry dates.
   *
   * These are currently not available at pre-acceptance stage in this flow.
   */
  const issueDate = "To be confirmed";
  const expiryDate = "To be confirmed";


  const subjectEntries = useMemo(() => {
    const filteredEntries = Object.entries(parsedCredentialSubject).filter(
      ([key]) => key !== "_sd"
    );

    return [...filteredEntries, ...Object.entries(parsedSdDisclosures)];
  }, [parsedCredentialSubject, parsedSdDisclosures]);

  const statusLabel = useMemo(() => {
    const normalised = displayStatus.trim().toLowerCase();


    if (normalised === "pending") return "Pending";
    if (normalised === "valid") return "Valid";
    if (normalised === "issued") return "Issued";
    return displayStatus;
  }, [displayStatus]);

  /**
   * Handles the user's confirmation action to receive the credential.
   */
  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);

      const effectiveOfferLink = String(offerLink ?? "").trim();

      if (!effectiveOfferLink) {
        Alert.alert(
          "Missing offer link",
          "A credential offer link is required to receive this credential."
        );
        return;
      }

      if (!isLikelyOfferLink(effectiveOfferLink)) {
        Alert.alert(
          "Invalid offer link",
          "This credential needs a real walt.id-backed credential offer link or QR."
        );
        return;
      }

      const pendingCredentialId = credentialId ?? null;

      if (!pendingCredentialId) {
        Alert.alert(
          "Missing credential",
          "No pending credential was available to accept."
        );
        return;
      }

      const existingCredentials = await fetchCredentials();

      const comparableExistingCredentials = existingCredentials.filter(
        (credential) =>
          credential.credential_id !== pendingCredentialId &&
          !(
            credential.status?.toLowerCase() === "pending" &&
            credential.offerLink?.trim().toLowerCase() ===
              effectiveOfferLink.trim().toLowerCase()
          )
      );

      const duplicateExists = isDuplicateCredential(
        comparableExistingCredentials,
        {
          credentialId: pendingCredentialId,
          title: displayTitle,
          issuer: displayIssuer,
          offerLink: effectiveOfferLink,
        }
      );

      if (duplicateExists) {
        Alert.alert(
          "Credential found in wallet.",
          "Delete first to add an updated version.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/(tabs)");
              },
            },
          ]
        );
        return;
      }

      await acceptCredential(pendingCredentialId);

      router.push({
        pathname: "/credential-created",
        params: {
          credentialId: pendingCredentialId,
          credentialName: displayTitle,
        },
      });
    } catch (error: any) {
      console.error("Failed to receive credential:", error);
      Alert.alert(
        "Error",
        error?.message || "Unable to receive credential from issuer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Returns to the previous screen.
   */
  const handleBack = () => {
    router.back();
  };


  return (
    <SafeAreaView style={uiSystem.safeArea} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={tokens.gradients.primary}
        locations={[0, 0.28, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={uiSystem.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.credentialFormScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.credentialFormTopSpacer} />

          <Text style={styles.supportingText}>
            Review the credential details before adding it to your wallet.
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeaderRow}>
              <View style={styles.summaryIconWrap}>
                <Ionicons
                  name="document-text-outline"
                  size={28}
                  color="#1F2937"
                />
              </View>

              <View style={styles.summaryHeaderText}>
                <Text
                  style={styles.summaryTitle}
                  numberOfLines={3}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                >
                  {displayTitle}
                </Text>
              </View>

              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusPillText}>{statusLabel}</Text>
              </View>
            </View>

            <View style={styles.summaryIssuerBlock}>
              <Text style={styles.summaryIssuerLabel}>Issued by</Text>
              <Text style={styles.summaryIssuer}>{displayIssuer}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Pressable
              style={styles.sectionHeader}
              onPress={() => setDetailsExpanded((prev) => !prev)}
            >
              <Text style={styles.sectionTitleLarge}>Credential Details</Text>
              <Ionicons
                name={detailsExpanded ? "chevron-up" : "chevron-down"}
                size={22}
                color="#6B7280"
              />
            </Pressable>

            {detailsExpanded ? (
              <View style={styles.detailList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Issuer</Text>
                  <Text style={styles.detailValue}>{displayIssuer}</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Credential Type</Text>
                  <Text style={styles.detailValue}>
                    {formatCredentialType(credentialType)}
                  </Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Issued</Text>
                  <Text style={styles.detailValue}>{issueDate}</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expires</Text>
                  <Text style={styles.detailValue}>{expiryDate}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.sectionHint}>Tap to view</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Pressable
              style={styles.sectionHeader}
              onPress={() => setAttributesExpanded((prev) => !prev)}
            >
              <Text style={styles.sectionTitleLarge}>Attributes</Text>
              <Ionicons
                name={attributesExpanded ? "chevron-up" : "chevron-down"}
                size={22}
                color="#6B7280"
              />
            </Pressable>

            {attributesExpanded ? (
              subjectEntries.length === 0 ? (
                <View style={styles.emptyAttributesCard}>
                  <Text style={styles.emptyAttributesText}>
                    Attribute details will be available after the credential is
                    received.
                  </Text>
                </View>
              ) : (
                <View style={styles.attributesList}>
                  {subjectEntries.map(([key, value], index) => (
                    <View key={`${key}-${index}`} style={styles.attributeItem}>
                      <View style={styles.attributeItemTop}>
                        <View style={styles.attributeBullet} />
                        <Text style={styles.attributeLabel}>
                          {formatLabel(key)}
                        </Text>
                      </View>

                      <Text style={styles.attributeValue}>{String(value)}</Text>
                    </View>
                  ))}
                </View>
              )
            ) : (
              <Text style={styles.sectionHint}>Tap to view</Text>
            )}
          </View>

          <Pressable
            style={[styles.confirmButton, isSubmitting && uiSystem.disabled]}
            onPress={handleConfirm}
            disabled={isSubmitting}
          >
            <Text style={styles.confirmButtonText}>
              {isSubmitting ? "Receiving..." : "Confirm & Continue"}
            </Text>
          </Pressable>

          <Pressable style={styles.formBackButton} onPress={handleBack}>
            <Ionicons
              name="arrow-back"
              size={18}
              color={tokens.colours.white}
            />
            <Text style={styles.formBackButtonText}>Back</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
