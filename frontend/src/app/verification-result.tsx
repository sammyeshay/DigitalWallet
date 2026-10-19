import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { credentialFlowStyles as styles } from "../styles/credentialFlow";

type ResultStatus = "success" | "error" | "cancelled";

function formatCredentialLabel(value?: string): string {
  if (!value) return "Credential";

  return value
    .replace(/Credential$/g, " Credential")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\bUbo\b/g, "UBO")
    .replace(/\bAml\b/g, "AML")
    .replace(/\bId\b/g, "ID")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCredentialNames(
  credentialNamesParam?: string | string[],
  credentialNameParam?: string
): string[] {
  if (Array.isArray(credentialNamesParam)) {
    return credentialNamesParam
      .flatMap((item) => {
        try {
          const parsed = JSON.parse(item);
          return Array.isArray(parsed) ? parsed : [item];
        } catch {
          return [item];
        }
      })
      .map((item) => formatCredentialLabel(String(item)))
      .filter(Boolean);
  }

  if (typeof credentialNamesParam === "string" && credentialNamesParam.trim()) {
    try {
      const parsed = JSON.parse(credentialNamesParam);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => formatCredentialLabel(String(item)))
          .filter(Boolean);
      }
    } catch {
      return [formatCredentialLabel(credentialNamesParam)];
    }
  }

  if (credentialNameParam?.trim()) {
    return [formatCredentialLabel(credentialNameParam)];
  }

  return [];
}

export default function VerificationResultScreen() {
  const params = useLocalSearchParams<{
    status?: string;
    message?: string;
    credentialId?: string;
    credentialName?: string;
    credentialNames?: string | string[];
  }>();

  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const status = (params.status as ResultStatus) || "error";
  const credentialId = params.credentialId?.trim() || undefined;

  const credentialNames = useMemo(
    () => parseCredentialNames(params.credentialNames, params.credentialName),
    [params.credentialNames, params.credentialName]
  );

  const isSuccess = status === "success";
  const isCancelled = status === "cancelled";
  const isError = status === "error";

  const heading = isSuccess
    ? "Success"
    : isCancelled
      ? "Cancelled"
      : "Failed";

  const title = useMemo(() => {
    if (isSuccess) {
      if (credentialNames.length > 1) {
        return "Credentials Presented";
      }
      if (credentialNames.length === 1) {
        return `${credentialNames[0]} Presented`;
      }
      return "Credential Presented";
    }

    if (isCancelled) {
      return "Verification Cancelled";
    }

    return "Verification Failed";
  }, [credentialNames, isCancelled, isSuccess]);

  const body = useMemo(() => {
    if (isSuccess) {
      return "Your credential was successfully presented to the verifier.";
    }

    if (isCancelled) {
      return "The verification request was cancelled before completion.";
    }

    return (
      params.message?.trim() ||
      "Something went wrong while presenting your credential to the verifier."
    );
  }, [isCancelled, isSuccess, params.message]);

  const handleViewCredential = () => {
    if (!credentialId) {
      router.replace("/(tabs)/credentials");
      return;
    }

    router.push({
      pathname: "/credential/[id]",
      params: { id: credentialId },
    });
  };

  const handleViewAllCredentials = () => {
    router.replace("/(tabs)/credentials");
  };

  const handleBackHome = () => {
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.verificationResult_safeArea} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={["#285CD4", "#3652DA", "#7253D4", "#B971B5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.verificationResult_gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.verificationResult_resultCard}>
            <View
              style={[
                styles.verificationResult_statusBadge,
                isSuccess
                  ? styles.verificationResult_statusBadgeSuccess
                  : isCancelled
                    ? styles.verificationResult_statusBadgeCancelled
                    : styles.verificationResult_statusBadgeError,
              ]}
            >
              <Text style={styles.verificationResult_statusBadgeText}>{heading}</Text>
            </View>

            <Text style={styles.verificationResult_resultTitle}>{title}</Text>
            <Text style={styles.verificationResult_resultBody}>{body}</Text>

            {isSuccess ? (
              <View style={styles.verificationResult_detailsCard}>
                <Pressable
                  style={styles.verificationResult_detailsHeader}
                  onPress={() => setDetailsExpanded((prev) => !prev)}
                >
                  <View style={styles.verificationResult_detailsHeaderTextWrap}>
                    <Text style={styles.verificationResult_detailsHeading}>Credential Details</Text>
                    <Text style={styles.verificationResult_detailsSubheading}>
                      {detailsExpanded ? "Tap to hide" : "Hidden for privacy"}
                    </Text>
                  </View>

                  <Ionicons
                    name={detailsExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#6B7280"
                  />
                </Pressable>

                {detailsExpanded ? (
                  <View style={styles.verificationResult_detailsBody}>
                    {credentialNames.length > 0 ? (
                      <>
                        <Text style={styles.detailLabel}>
                          {credentialNames.length > 1 ? "Credentials" : "Credential"}
                        </Text>

                        {credentialNames.map((name, index) => (
                          <Text
                            key={`${name}-${index}`}
                            style={styles.detailValue}
                          >
                            {name}
                          </Text>
                        ))}
                      </>
                    ) : null}

                    <Text style={styles.detailLabel}>Credential ID</Text>
                    <Text style={styles.detailValue}>
                      {credentialId || "Unavailable"}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.verificationResult_actions}>
              {isSuccess && credentialId ? (
                <Pressable
                  style={styles.verificationResult_primaryButton}
                  onPress={handleViewCredential}
                >
                  <Text style={styles.verificationResult_primaryButtonText}>View Credential</Text>
                </Pressable>
              ) : null}

              <Pressable
                style={styles.verificationResult_secondaryButton}
                onPress={handleViewAllCredentials}
              >
                <Text style={styles.verificationResult_secondaryButtonText}>
                  View All Credentials
                </Text>
              </Pressable>

              <Pressable
                style={styles.verificationResult_tertiaryButton}
                onPress={handleBackHome}
              >
                <Text style={styles.verificationResult_tertiaryButtonText}>Back to Home</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}