import { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";


import { previewCredentialOffer } from "../../api/credentials";
import { credentialFlowStyles as styles } from "../styles/credentialFlow";
import { segmentedControlStyles } from "../styles/segmentedControl.styles";
import { tokens } from "../styles/tokens";
import { uiSystem } from "../styles/uiSystem";

/**
 * Credential types currently supported by the wallet issuance flow.
 *
 * These are used to validate scanned JSON payloads before allowing the user to
 * continue to the credential preview / confirmation step.
 */
type SupportedCredentialType =
  | "DirectorIdCredential"
  | "CorporateRegistrationCredential"
  | "UboAttestationCredential"
  | "AmlComplianceCredential"
  | "SanctionScreeningCredential";

/**
 * Canonical list of supported credential types.
 *
 * Keeping the supported values in one constant avoids repeating magic strings
 * across validation helpers.
 */
const SUPPORTED_CREDENTIAL_TYPES: SupportedCredentialType[] = [
  "DirectorIdCredential",
  "CorporateRegistrationCredential",
  "UboAttestationCredential",
  "AmlComplianceCredential",
  "SanctionScreeningCredential",
];

/**
 * Expected JSON payload shape when a QR code directly contains credential data
 * rather than a credential offer URL.
 */
type CredentialJsonPayload = {
  id: string;
  title: string;
  issuer: string;
  status: string;
  type?: string | string[];
  offerLink?: string;
  credentialSubject?: Record<string, unknown>;
  disclosures?: string;
};

/**
 * Result returned after validating scanned QR content.
 *
 * A QR code may resolve to:
 * - a supported credential offer URL
 * - a supported credential JSON payload
 * - an invalid or unsupported value
 */
type ValidatedScanResult =
  | {
      isValid: true;
      type: "credential-offer-url";
      value: string;
    }
  | {
      isValid: true;
      type: "credential-json";
      value: CredentialJsonPayload;
    }
  | {
      isValid: false;
      error: string;
    };

/**
 * Checks whether a provided credential type matches one of the wallet's
 * supported types.
 *
 * Handles both:
 * - a single type string
 * - an array of type strings as commonly found in VC payloads
 *
 * @param typeValue Credential type field from a payload
 * @returns True when at least one supported credential type is present
 */
function hasSupportedCredentialType(typeValue?: string | string[]): boolean {
  if (!typeValue) return false;

  if (typeof typeValue === "string") {
    return SUPPORTED_CREDENTIAL_TYPES.includes(
      typeValue as SupportedCredentialType
    );
  }

  return typeValue.some((item) =>
    SUPPORTED_CREDENTIAL_TYPES.includes(item as SupportedCredentialType)
  );
}


/**
 * Determines whether a string looks like a credential offer URL.
 *
 * Supported formats:
 * - openid-credential-offer://...
 * - http(s) links containing the credential_offer parameter
 *
 * @param value Raw scanned or entered string
 * @returns True when the value matches a supported credential-offer pattern
 */
function isCredentialOfferUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();

  return (
    trimmed.startsWith("openid-credential-offer://") ||
    ((trimmed.startsWith("http://") || trimmed.startsWith("https://")) &&
      trimmed.includes("credential_offer"))
  );
}

/**
 * Resolves a raw credential type field into one supported credential type.
 *
 * For array-based VC types, this ignores the generic "VerifiableCredential"
 * wrapper and returns the first recognised wallet-specific type.
 *
 * @param typeValue Credential type field from a payload
 * @returns Supported credential type or undefined if no supported type exists
 */
function normaliseCredentialType(
  typeValue?: string | string[]
): SupportedCredentialType | undefined {
  if (!typeValue) return undefined;

  if (typeof typeValue === "string") {
    return SUPPORTED_CREDENTIAL_TYPES.includes(
      typeValue as SupportedCredentialType
    )
      ? (typeValue as SupportedCredentialType)
      : undefined;
  }

  const resolved = typeValue.find(
    (item) =>
      item !== "VerifiableCredential" &&
      SUPPORTED_CREDENTIAL_TYPES.includes(item as SupportedCredentialType)
  );


  return resolved as SupportedCredentialType | undefined;
}


/**
 * Validates the manually entered credential offer link from the "Open Link" tab.
 *
 * @param rawValue User-entered offer link
 * @returns Either a trimmed valid value or a user-facing validation error
 */
function validateOfferLinkInput(
  rawValue: string
): { isValid: true; value: string } | { isValid: false; error: string } {
  const value = rawValue.trim();

  if (!value) {
    return {
      isValid: false,
      error: "Please enter a credential offer link.",
    };
  }

  if (!isCredentialOfferUrl(value)) {
    return {
      isValid: false,
      error:
        "This does not look like a valid credential offer link from the issuer.",
    };
  }

  return {
    isValid: true,
    value,
  };
}

/**
 * Decodes a base64url disclosure string into UTF-8 text.
 *
 * This is used to process selective disclosure values returned by SD-JWT style
 * credential payloads.
 *
 * @param b64 Base64/base64url encoded disclosure string
 * @returns Decoded UTF-8 string
 */
function base64ToUtf8(b64: string) {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Decodes a tilde-separated disclosures string into key/value pairs.
 *
 * Each disclosure is expected to decode to a JSON array of the form:
 * [salt, key, value]
 *
 * Malformed disclosures are skipped rather than breaking the flow.
 *
 * @param disclosures Encoded disclosure string
 * @returns Object containing decoded disclosure key/value pairs
 */
export function unhashDisclosures(disclosures: string): Record<string, any> {
  if (!disclosures) return {};

  const pairs: Record<string, any> = {};

  const details = disclosures.split("~");

  for (const item of details) {
    try {
      const b64 = item.replace(/-/g, "+").replace(/_/g, "/");
      const jsonStr = base64ToUtf8(b64);
      const [, key, value] = JSON.parse(jsonStr);
      pairs[key] = value;
    } catch (err) {
      console.warn("Failed to decode disclosure:", item, err);
    }
  }

  return pairs;
}

/**
 * Validates scanned QR code content and classifies it as either:
 * - a credential offer URL
 * - a wallet-supported credential JSON payload
 * - invalid / unsupported input
 *
 * @param rawData Raw QR code payload
 * @returns Structured validation result
 */
function validateScannedCredentialPayload(rawData: string): ValidatedScanResult {
  const value = rawData.trim();

  if (!value) {
    return {
      isValid: false,
      error: "The scanned QR code was empty.",
    };
  }

  if (isCredentialOfferUrl(value)) {
    return {
      isValid: true,
      type: "credential-offer-url",
      value,
    };
  }

  try {
    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        isValid: false,
        error: "The QR code does not contain a valid credential payload.",
      };
    }

    const requiredFields = ["id", "title", "issuer", "status"] as const;

    for (const field of requiredFields) {
      if (typeof parsed[field] !== "string" || !parsed[field].trim()) {
        return {
          isValid: false,
          error: `Missing or invalid required field: ${field}.`,
        };
      }
    }

    if (!hasSupportedCredentialType(parsed.type)) {
      return {
        isValid: false,
        error: "This credential type is not supported by the wallet.",
      };
    }

    return {
      isValid: true,
      type: "credential-json",
      value: {
        id: parsed.id.trim(),
        title: parsed.title.trim(),
        issuer: parsed.issuer.trim(),
        status: parsed.status.trim(),
        type: parsed.type,
        offerLink:
          typeof parsed.offerLink === "string"
            ? parsed.offerLink.trim()
            : undefined,
        credentialSubject:
          parsed.credentialSubject &&
          typeof parsed.credentialSubject === "object" &&
          !Array.isArray(parsed.credentialSubject)
            ? parsed.credentialSubject
            : undefined,
        disclosures:
          typeof parsed.disclosures === "string" ? parsed.disclosures : undefined,
      },
    };
  } catch {
    return {
      isValid: false,
      error: "This QR code is malformed or unsupported.",
    };
  }
}

/**
 * AddCredentialScreen allows the user to add a credential in one of two ways:
 *
 * - scan a QR code using the device camera
 * - paste a credential offer link manually
 *
 * The screen validates scanned or entered input, previews the credential offer,
 * and then routes the user to the credential confirmation form.
 *
 * @returns React Native screen component for adding a credential
 */
export default function AddCredentialScreen() {
  /**
   * Current input mode shown to the user.
   */
  const [selectedTab, setSelectedTab] = useState<"scan" | "link">("scan");

  /**
   * User-entered credential offer link when the "Open Link" tab is active.
   */
  const [offerLink, setOfferLink] = useState("");

  /**
   * Flag used to prevent duplicate QR scans from firing repeatedly.
   */
  const [hasScanned, setHasScanned] = useState(false);

  /**
   * Loading flag for QR scan processing.
   */
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  /**
   * Loading flag for manual link processing.
   */
  const [isProcessingLink, setIsProcessingLink] = useState(false);

  /**
   * User-facing validation or processing error shown on screen.
   */
  const [scanError, setScanError] = useState("");

  /**
   * Camera permission state and permission request function from expo-camera.
   */
  const [permission, requestPermission] = useCameraPermissions();

  /**
   * Ref guard used to prevent overlapping scan handlers from running.
   */
  const isHandlingScanRef = useRef(false);

  /**
   * Ref guard used to prevent duplicate navigation if multiple async branches
   * resolve around the same time.
   */
  const hasNavigatedRef = useRef(false);

  /**
   * Stores the last scanned QR payload so repeated scans of the same value can
   * be temporarily ignored.
   */
  const lastScannedValueRef = useRef<string | null>(null);

  /**
   * Timestamp for the last scanned QR payload, used for short debounce logic.
   */
  const lastScannedAtRef = useRef<number>(0);

  /**
   * Resets transient scan and navigation state.
   *
   * This is used when:
   * - the screen regains focus
   * - the user retries scanning
   * - the user switches back to the scan tab
   */
  const resetScanState = useCallback(() => {
    setHasScanned(false);
    setIsProcessingScan(false);
    setIsProcessingLink(false);
    setScanError("");
    isHandlingScanRef.current = false;
    hasNavigatedRef.current = false;
    lastScannedValueRef.current = null;
    lastScannedAtRef.current = 0;
  }, []);

  /**
   * Resets scan state every time the screen regains focus.
   *
   * This ensures stale scan state does not remain when the user returns from
   * the credential form or another screen.
   */
  useFocusEffect(
    useCallback(() => {
      resetScanState();
    }, [resetScanState])
  );

  /**
   * Handles the "Continue" action when the user pastes a credential offer link.
   *
   * Flow:
   * - validate entered link
   * - preview the credential offer
   * - resolve the credential type
   * - navigate to the credential form with preview data
   */
  const handleContinueWithLink = async () => {
    if (isProcessingLink || hasNavigatedRef.current) return;

    const validationResult = validateOfferLinkInput(offerLink);

    if (!validationResult.isValid) {
      setScanError(validationResult.error);
      return;
    }

    setScanError("");
    setIsProcessingLink(true);

    try {
      const preview = await previewCredentialOffer(validationResult.value);

      if (hasNavigatedRef.current) return;

      hasNavigatedRef.current = true;

      const previewType = Array.isArray(preview.raw?.parsedDocument?.type)
        ? preview.raw.parsedDocument.type.find(
            (item: string) => item !== "VerifiableCredential"
          ) ?? ""
        : "";

      router.push({
        pathname: "/credential-form",
        params: {
          method: "link",
          offerLink: validationResult.value,
          credentialId: preview.credential_id,
          credentialName: preview.title,
          issuer: preview.issuer,
          status: preview.status,
          credentialType: previewType,
          credentialSubject: JSON.stringify(preview.credentialSubject ?? {}),
          sdDisclosures: JSON.stringify(
            unhashDisclosures(preview.disclosures ?? "")
          ),
        },
      });
    } catch (error) {
      console.error("Failed to preview credential offer from link:", error);
      setScanError(
        "Unable to load this credential offer. Check that the issuer link is reachable."
      );
      hasNavigatedRef.current = false;
    } finally {
      setIsProcessingLink(false);
    }
  };

  /**
   * Uses Expo Router's history stack to return to the previous screen.
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * Handles QR scan results emitted by the camera.
   *
   * Safeguards:
   * - ignores duplicate in-flight scans
   * - ignores repeated scans of the same value within a short time window
   * - blocks duplicate navigation
   *
   * Supported scan outcomes:
   * - credential offer URL → fetch preview then navigate
   * - credential JSON payload → validate and navigate directly
   *
   * @param data Raw scanned QR code data
   */
  const handleScanResult = async (data: string) => {
    const trimmedData = data.trim();
    const now = Date.now();

    if (hasNavigatedRef.current || isHandlingScanRef.current) return;

    if (
      lastScannedValueRef.current === trimmedData &&
      now - lastScannedAtRef.current < 2500
    ) {
      return;
    }

    isHandlingScanRef.current = true;
    lastScannedValueRef.current = trimmedData;
    lastScannedAtRef.current = now;

    setHasScanned(true);
    setIsProcessingScan(true);
    setScanError("");

    try {
      const validationResult = validateScannedCredentialPayload(trimmedData);

      if (!validationResult.isValid) {
        setScanError(validationResult.error);
        setHasScanned(false);
        isHandlingScanRef.current = false;
        return;
      }

      if (validationResult.type === "credential-offer-url") {
        const preview = await previewCredentialOffer(validationResult.value);

        if (hasNavigatedRef.current) return;

        hasNavigatedRef.current = true;

        const previewType = Array.isArray(preview.raw?.parsedDocument?.type)
          ? preview.raw.parsedDocument.type.find(
              (item: string) => item !== "VerifiableCredential"
            ) ?? ""
          : "";

        router.push({
          pathname: "/credential-form",
          params: {
            method: "scan",
            offerLink: validationResult.value,
            credentialId: preview.credential_id,
            credentialName: preview.title,
            issuer: preview.issuer,
            status: preview.status,
            credentialType: previewType,
            credentialSubject: JSON.stringify(preview.credentialSubject ?? {}),
            sdDisclosures: JSON.stringify(
              unhashDisclosures(preview.disclosures ?? "")
            ),
          },
        });
        return;
      }

      const resolvedType = normaliseCredentialType(validationResult.value.type);

      if (hasNavigatedRef.current) return;

      hasNavigatedRef.current = true;

      router.push({
        pathname: "/credential-form",
        params: {
          method: "scan",
          credentialId: validationResult.value.id,
          offerLink: validationResult.value.offerLink ?? "",
          credentialName: validationResult.value.title,
          issuer: validationResult.value.issuer,
          status: validationResult.value.status,
          credentialType: resolvedType ?? "",
          credentialSubject: JSON.stringify(
            validationResult.value.credentialSubject ?? {}
          ),
          sdDisclosures: JSON.stringify(validationResult.value.disclosures ?? ""),
        },
      });
    } catch (error) {
      console.error("Failed to process QR scan:", error);
      setScanError("Something went wrong while processing the QR code.");
      setHasScanned(false);
      isHandlingScanRef.current = false;
      hasNavigatedRef.current = false;
    } finally {
      setIsProcessingScan(false);
    }
  };

  /**
   * Allows the user to retry after a scan error.
   */
  const handleRetryScan = () => {
    resetScanState();
  };

  /**
   * Switches between scan and manual-link modes.
   *
   * When returning to the scan tab, scan state is reset so the camera is ready
   * to capture again.
   *
   * @param tab Target tab to activate
   */
  const handleSwitchTab = (tab: "scan" | "link") => {
    if (isProcessingLink) return;

    setSelectedTab(tab);
    setScanError("");

    if (tab === "scan") {
      resetScanState();
    }
  };

  return (
    <SafeAreaView style={uiSystem.safeArea} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={tokens.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={uiSystem.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.segmentedWrap}>
            <View style={segmentedControlStyles.tabWrap}>
              <Pressable
                style={[
                  segmentedControlStyles.tabButton,
                  selectedTab === "scan" &&
                    segmentedControlStyles.tabButtonActive,
                ]}
                onPress={() => handleSwitchTab("scan")}
                disabled={isProcessingLink}
              >
                <Text
                  style={[
                    segmentedControlStyles.tabText,
                    selectedTab === "scan" &&
                      segmentedControlStyles.tabTextActive,
                  ]}
                >
                  Scan QR Code
                </Text>
              </Pressable>

              <Pressable
                style={[
                  segmentedControlStyles.tabButton,
                  selectedTab === "link" &&
                    segmentedControlStyles.tabButtonActive,
                ]}
                onPress={() => handleSwitchTab("link")}
                disabled={isProcessingLink}
              >
                <Text
                  style={[
                    segmentedControlStyles.tabText,
                    selectedTab === "link" &&
                      segmentedControlStyles.tabTextActive,
                  ]}
                >
                  Open Link
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroCard}>
            {selectedTab === "scan" ? (
              <>
                {!permission ? (
                  <View style={styles.heroStateContainer}>
                    <Text style={styles.heroStateTitle}>Loading camera...</Text>
                  </View>
                ) : !permission.granted ? (
                  <Pressable
                    style={styles.heroStateContainer}
                    onPress={requestPermission}
                  >
                    <Text style={styles.heroStateTitle}>
                      Camera access required
                    </Text>
                    <Text style={styles.heroStateText}>
                      Tap here to allow camera access and scan a credential QR
                      code.
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.cameraShell}>
                    <View style={styles.cameraCard}>
                      <CameraView
                        style={styles.cameraPreview}
                        facing="back"
                        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                        onBarcodeScanned={
                          hasScanned ||
                          isProcessingScan ||
                          isHandlingScanRef.current ||
                          hasNavigatedRef.current
                            ? undefined
                            : ({ data }) => {
                                void handleScanResult(data);
                              }
                        }
                      />

                      <View style={styles.cameraOverlay} pointerEvents="none">
                        <View style={styles.scanFrameOuter}>
                          <View style={styles.scanFrameInner} />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.linkHeroContent}>
                <Text style={styles.linkHeroTitle}>Paste issuer link</Text>
                <Text style={styles.linkHeroText}>
                  Add a credential by opening a supported credential offer link.
                </Text>

                <TextInput
                  style={[uiSystem.input, styles.linkInput]}
                  placeholder="Enter credential offer link"
                  placeholderTextColor={tokens.colours.textMuted}
                  value={offerLink}
                  onChangeText={(value) => {
                    setOfferLink(value);
                    if (scanError) setScanError("");
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isProcessingLink}
                />

                <Pressable
                  style={[
                    uiSystem.primaryButton,
                    styles.continueButton,
                    isProcessingLink && uiSystem.disabled,
                  ]}
                  onPress={() => {
                    void handleContinueWithLink();
                  }}
                  disabled={isProcessingLink}
                >
                  <Text style={uiSystem.primaryButtonText}>
                    {isProcessingLink ? "Loading..." : "Continue"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[uiSystem.secondaryButton, styles.backButton]}
                  onPress={handleBack}
                >
                  <Text style={uiSystem.secondaryButtonText}>Back</Text>
                </Pressable>
              </View>
            )}

            {scanError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{scanError}</Text>

                {selectedTab === "scan" ? (
                  <Pressable style={styles.retryButton} onPress={handleRetryScan}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>

          <Text style={styles.supportingText}>
            {selectedTab === "scan"
              ? "Position the QR code from the issuer inside the frame to continue."
              : "Paste the issuer link below to preview and add your credential."}
          </Text>

          {selectedTab === "scan" ? (
            <Pressable
              style={[uiSystem.secondaryButton, styles.scanBackButton]}
              onPress={handleBack}
            >
              <Text style={uiSystem.secondaryButtonText}>Back</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
