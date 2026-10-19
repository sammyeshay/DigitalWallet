import { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";


import { credentialFlowStyles as styles } from "../styles/credentialFlow";
import { segmentedControlStyles } from "../styles/segmentedControl.styles";
import { tokens } from "../styles/tokens";
import { uiSystem } from "../styles/uiSystem";

type ValidatedPresentationRequest =
  | {
      isValid: true;
      value: string;
    }
  | {
      isValid: false;
      error: string;
    };

/**
 * Validates a presentation request URL supplied by either:
 * - a scanned QR code
 * - a manually pasted verification link
 *
 * Validation checks:
 * - the input is not empty
 * - the value is a valid URL
 * - the protocol is supported
 * - required verification request parameters are present
 *
 * Supported protocols:
 * - openid4vp:
 * - https:
 *
 * Required parameters:
 * - client_id
 * - response_type
 * - response_uri
 * - state
 * - nonce
 * - one of:
 *   - request_uri
 *   - presentation_definition
 *   - presentation_definition_uri
 *
 * @param rawValue Raw scanned or pasted request string
 * @returns Validation result containing either a clean URL or an error message
 */
function validatePresentationRequestInput(
  rawValue: string
): ValidatedPresentationRequest {
  const value = rawValue.trim();

  if (!value) {
    return {
      isValid: false,
      error: "The scanned QR code was empty.",
    };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    return {
      isValid: false,
      error: "This QR code does not contain a valid verification request URL.",
    };
  }

  const allowedProtocols = ["openid4vp:", "https:"];

  if (!allowedProtocols.includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      error: `Unsupported QR protocol: ${parsedUrl.protocol || "unknown"}`,
    };
  }

  const hasClientId = parsedUrl.searchParams.has("client_id");
  const hasResponseType = parsedUrl.searchParams.has("response_type");
  const hasResponseUri = parsedUrl.searchParams.has("response_uri");
  const hasRequestUri = parsedUrl.searchParams.has("request_uri");
  const hasPresentationDefinition = parsedUrl.searchParams.has(
    "presentation_definition"
  );
  const hasPresentationDefinitionUri = parsedUrl.searchParams.has(
    "presentation_definition_uri"
  );
  const hasState = parsedUrl.searchParams.has("state");
  const hasNonce = parsedUrl.searchParams.has("nonce");

  const hasPresentationRequest =
    hasRequestUri ||
    hasPresentationDefinition ||
    hasPresentationDefinitionUri;

  if (!hasClientId) {
    return {
      isValid: false,
      error: "QR code is missing required parameter: client_id",
    };
  }

  if (!hasResponseType) {
    return {
      isValid: false,
      error: "QR code is missing required parameter: response_type",
    };
  }

  if (!hasPresentationRequest) {
    return {
      isValid: false,
      error: "QR code is missing a presentation definition or request URI.",
    };
  }

  if (!hasResponseUri) {
    return {
      isValid: false,
      error: "QR code is missing required parameter: response_uri",
    };
  }

  if (!hasState) {
    return {
      isValid: false,
      error: "QR code is missing required parameter: state",
    };
  }

  if (!hasNonce) {
    return {
      isValid: false,
      error: "QR code is missing required parameter: nonce",
    };
  }

  return {
    isValid: true,
    value,
  };
}

/**
 * PresentCredentialScreen allows the user to begin a credential presentation
 * flow by either:
 * - scanning a verifier QR code, or
 * - pasting a verification request link manually
 *
 * The screen validates the incoming request, guards against duplicate scans and
 * duplicate navigation, then routes the user to the verification request screen.
 *
 * @returns React Native screen for starting the presentation flow
 */
export default function PresentCredentialScreen() {
  /**
   * Current input mode shown to the user.
   */
  const [selectedTab, setSelectedTab] = useState<"scan" | "link">("scan");

  /**
   * Manually entered presentation request URL.
   */
  const [requestLink, setRequestLink] = useState("");

  /**
   * Prevents the camera from continuing to process QR results after a scan has
   * already been captured.
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
   * User-facing validation or processing error.
   */
  const [scanError, setScanError] = useState("");

  /**
   * Camera permission state and permission request helper from expo-camera.
   */
  const [permission, requestPermission] = useCameraPermissions();

  /**
   * Ref guard to prevent concurrent scan processing.
   *
   * CameraView can emit multiple barcode events quickly, so this prevents
   * duplicate validation and duplicate routing.
   */
  const isHandlingScanRef = useRef(false);

  /**
   * Ref guard to prevent duplicate navigation if multiple async handlers
   * complete close together.
   */
  const hasNavigatedRef = useRef(false);

  /**
   * Stores the most recent scanned QR payload so repeated reads of the same QR
   * code can be ignored temporarily.
   */
  const lastScannedValueRef = useRef<string | null>(null);

  /**
   * Timestamp of the most recent scanned QR payload.
   *
   * Used with lastScannedValueRef to debounce repeated scan events.
   */
  const lastScannedAtRef = useRef<number>(0);

  /**
   * Resets transient scan state so the user can retry safely.
   *
   * This clears:
   * - scan progress flags
   * - link loading state
   * - navigation/scan guards
   * - previous scan data
   * - visible error messages
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
   * Resets the scan state whenever the screen regains focus.
   *
   * This ensures the screen is ready for a fresh scan if the user returns from
   * a later verification step.
   */
  useFocusEffect(
    useCallback(() => {
      resetScanState();
    }, [resetScanState])
  );

  /**
   * Routes the user to the verification request screen with the validated
   * presentation request.
   *
   * The request is URI-encoded before being passed through route params.
   *
   * @param presentationRequest Validated presentation request URL
   */
  const proceedToRequest = (presentationRequest: string) => {
    if (hasNavigatedRef.current) return;

    hasNavigatedRef.current = true;

    router.push({
      pathname: "/verification-request",
      params: {
        presentationRequest: encodeURIComponent(presentationRequest),
      },
    });
  };

  /**
   * Handles manual continuation from the "Open Link" tab.
   *
   * Workflow:
   * - block duplicate submissions
   * - validate the pasted request URL
   * - clear previous errors
   * - navigate to the verification request screen
   *
   * Any processing error is surfaced to the user as inline feedback.
   */
  const handleContinueWithLink = async () => {
    if (isProcessingLink || hasNavigatedRef.current) return;

    const validationResult = validatePresentationRequestInput(requestLink);

    if (!validationResult.isValid) {
      setScanError(validationResult.error);
      return;
    }

    setScanError("");
    setIsProcessingLink(true);

    try {
      proceedToRequest(validationResult.value);
    } catch (error) {
      console.error("Failed to process presentation request link:", error);
      setScanError(
        "Unable to open this verification request. Check that the link is valid."
      );
      hasNavigatedRef.current = false;
    } finally {
      setIsProcessingLink(false);
    }
  };

  /**
   * Handles the back action for both presentation entry modes.
   *
   * This uses Expo Router's history stack so the user returns to the previous
   * screen without hardcoding a route.
   *
   * Shared by:
   * - the back button under Continue on the link page
   * - the back button under the QR instruction text on the scan page
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * Handles QR scan results emitted by the camera.
   *
   * Safeguards:
   * - ignores scans while navigation is already in progress
   * - ignores scans while another scan is being processed
   * - ignores repeated reads of the same QR code within a short debounce window
   *
   * Workflow:
   * - trim and debounce the scanned data
   * - validate the request
   * - show an inline error if invalid
   * - navigate to the verification request screen if valid
   *
   * @param data Raw QR payload returned by the camera scanner
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
      const validationResult = validatePresentationRequestInput(trimmedData);

      if (!validationResult.isValid) {
        setScanError(validationResult.error);
        setHasScanned(false);
        isHandlingScanRef.current = false;
        return;
      }

      proceedToRequest(validationResult.value);
    } catch (error) {
      console.error("Failed to process verifier QR scan:", error);
      setScanError("Something went wrong while processing the verifier QR code.");
      setHasScanned(false);
      isHandlingScanRef.current = false;
      hasNavigatedRef.current = false;
    } finally {
      setIsProcessingScan(false);
    }
  };

  /**
   * Allows the user to retry scanning after an error.
   */
  const handleRetryScan = () => {
    resetScanState();
  };

  /**
   * Switches between QR scan mode and manual link mode.
   *
   * Returning to the scan tab resets scan state so the camera can be used again.
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
                  selectedTab === "scan" && segmentedControlStyles.tabButtonActive,
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
                  selectedTab === "link" && segmentedControlStyles.tabButtonActive,
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
                      Tap here to allow camera access and scan a verifier QR
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
                <Text style={styles.linkHeroTitle}>Paste verifier link</Text>
                <Text style={styles.linkHeroText}>
                  Open a supported verification request link to continue to the
                  presentation step.
                </Text>

                <TextInput
                  style={[uiSystem.input, styles.linkInput]}
                  placeholder="Enter verification request link"
                  placeholderTextColor={tokens.colours.textMuted}
                  value={requestLink}
                  onChangeText={(value) => {
                    setRequestLink(value);
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
              ? "Position the QR code from the verifier inside the frame to continue."
              : "Paste the supported OpenID verification link above to review the request and continue."}
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
