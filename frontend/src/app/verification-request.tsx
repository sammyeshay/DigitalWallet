import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { credentialFlowStyles as styles } from "../styles/credentialFlow";

import {
  resolvePresentationRequest,
  matchCredentialsForPresentationDefinition,
  submitPresentationRequest,
  ensureDid,
} from "../../api/credentials";

import { 
  recordCredentialPresented,
  recordVerificationResult
} from "../../api/activity";

import {
  clearSelections,
  getSelections,
  hasSelections,
} from "../stores/disclosureStore";
import { getSafeCredentialTitle } from "../../api/expiry-config";

type ResolvedPresentationRequest = {
  presentation_definition?: {
    id?: string;
    input_descriptors?: {
      id?: string;
      name?: string;
      purpose?: string;
      constraints?: {
        fields?: {
          path?: string[];
          name?: string;
          purpose?: string;
        }[];
      };
    }[];
  };
  [key: string]: unknown;
};

type WalletCredential = {
  id?: string;
  credentialId?: string;
  title?: string;
  issuer?: string | Record<string, unknown>;
  disclosures?: string;
  raw?: {
    parsedDocument?: {
      type?: string | string[];
      issuer?: string | Record<string, unknown>;
      credentialSubject?: Record<string, unknown>;
      name?: string;
    };
  };
  parsedDocument?: {
    type?: string | string[];
    issuer?: string | Record<string, unknown>;
    credentialSubject?: Record<string, unknown>;
    name?: string;
  };
  credentialSubject?: Record<string, unknown>;
  [key: string]: unknown;
};

type MatchCredentialsResponse =
  | WalletCredential[]
  | { matches?: WalletCredential[] };

function getCredentialId(credential: WalletCredential, index?: number): string {
  return credential.credentialId || credential.id || `fallback-${index ?? 0}`;
}

function getCredentialTitle(credential: WalletCredential | null): string {
  if (!credential) return "Credential";
  return (
    credential.title ||
    credential.parsedDocument?.name ||
    credential.raw?.parsedDocument?.name ||
    "Credential"
  );
}

function getCredentialIssuer(credential: WalletCredential): string {
  const issuer =
    credential.issuer ??
    credential.raw?.parsedDocument?.issuer ??
    credential.parsedDocument?.issuer;

  if (!issuer) return "Unknown issuer";

  if (typeof issuer === "string") return issuer;

  if (typeof issuer === "object") {
    const record = issuer as Record<string, unknown>;
    if (typeof record.name === "string" && record.name.trim()) {
      return record.name.trim();
    }
    if (typeof record.id === "string" && record.id.trim()) {
      return record.id.trim();
    }
  }

  return "Unknown issuer";
}

function buildDisclosureMap(credential: WalletCredential): Record<string, string> {
  const disclosuresStr = credential.disclosures ?? "";
  if (!disclosuresStr) return {};

  const map: Record<string, string> = {};

  for (const part of disclosuresStr.split("~").filter(Boolean)) {
    try {
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded)) as unknown[];

      if (typeof decoded[1] === "string") {
        map[decoded[1]] = part;
      }
    } catch {
      // Ignore malformed disclosure fragments
    }
  }

  return map;
}

function formatCredentialLabel(value?: string): string {
  if (!value) return "Requested credential";

  return value
    .replace(/Credential$/g, " Credential")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\bUbo\b/g, "UBO")
    .replace(/\bAml\b/g, "AML")
    .replace(/\bId\b/g, "ID")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMatchedCredentials(
  data: MatchCredentialsResponse
): WalletCredential[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.matches)) return data.matches;
  return [];
}

function getRequestedCredentialLabel(
  resolvedRequest: ResolvedPresentationRequest | null
): string {
  const descriptor = resolvedRequest?.presentation_definition?.input_descriptors?.[0];
  return formatCredentialLabel(
    descriptor?.name || descriptor?.id || "Requested credential"
  );
}

export default function VerificationRequestScreen() {
  const params = useLocalSearchParams<{ presentationRequest?: string }>();

  const presentationRequest = useMemo(() => {
    const raw = params.presentationRequest?.trim() || "";
    return raw ? decodeURIComponent(raw) : "";
  }, [params.presentationRequest]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedRequest, setResolvedRequest] =
    useState<ResolvedPresentationRequest | null>(null);
  const [matchedCredentials, setMatchedCredentials] = useState<WalletCredential[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [noMatchingCredential, setNoMatchingCredential] = useState(false);
  const [savedDisclosures, setSavedDisclosures] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [matchedTypes, setMatchedTypes] = useState<string[]>([]);

  useEffect(() => {
    const loadRequest = async () => {
      try {
        setLoading(true);
        setError(null);
        setMatchedCredentials([]);
        setSelectedIds([]);
        setNoMatchingCredential(false);
        setMatchedTypes([]);
        clearSelections();

        if (!presentationRequest) {
          throw new Error("Missing presentation request");
        }

        const resolvedData =
          (await resolvePresentationRequest(
            presentationRequest
          )) as ResolvedPresentationRequest;

        const presentationDefinition = resolvedData.presentation_definition;
        if (!presentationDefinition) {
          throw new Error("No presentation definition returned by backend");
        }

        setResolvedRequest(resolvedData);

        const matchData =
          (await matchCredentialsForPresentationDefinition(
            presentationDefinition
          )) as MatchCredentialsResponse;

        const credentials = extractMatchedCredentials(matchData);

        const typesAvailable = credentials
          .map((item) => {
            const typeValue =
              item.parsedDocument?.type ??
              item.raw?.parsedDocument?.type;

            if (Array.isArray(typeValue)) {
              return typeValue[typeValue.length - 1];
            }

            return typeValue;
          })
          .filter((item): item is string => typeof item === "string")
          .map((item) => formatCredentialLabel(item));

        setMatchedTypes(typesAvailable);

        if (!credentials.length) {
          setNoMatchingCredential(true);
          return;
        }

        setMatchedCredentials(credentials);
        setSelectedIds(credentials.map((cred, index) => getCredentialId(cred, index)));
      } catch (err: any) {
        if (__DEV__) {
          console.error("Failed to load verification request:", err);
        }
        setError(err?.message || "Failed to load verification request");
      } finally {
        setLoading(false);
      }
    };

    void loadRequest();
  }, [presentationRequest]);

  useFocusEffect(
    useCallback(() => {
      setSavedDisclosures({ ...getSelections() });
    }, [])
  );

  const selectedCredentials = useMemo(
    () =>
      matchedCredentials.filter((credential, index) =>
        selectedIds.includes(getCredentialId(credential, index))
      ),
    [matchedCredentials, selectedIds]
  );

  const requestedCredentialLabel = useMemo(
    () => getRequestedCredentialLabel(resolvedRequest),
    [resolvedRequest]
  );

  const handleApprove = async () => {
    try {
      if (selectedIds.length === 0) {
        throw new Error("Please select a credential");
      }

      setSubmitting(true);
      setError(null);

      await ensureDid();

      const disclosures: Record<string, string[]> = {};

      for (const credentialId of selectedIds) {
        const credential = matchedCredentials.find(
          (item, index) => getCredentialId(item, index) === credentialId
        );

        if (!credential) continue;

        const map = buildDisclosureMap(credential);
        if (Object.keys(map).length === 0) continue;

        const toggles = hasSelections(credentialId)
          ? getSelections()[credentialId]
          : Object.fromEntries(Object.keys(map).map((key) => [key, true]));

        const chosen = Object.entries(toggles)
          .filter(([, isOn]) => isOn)
          .map(([key]) => map[key])
          .filter(Boolean) as string[];

        if (chosen.length > 0) {
          disclosures[credentialId] = chosen;
        }
      }

      const result = (await submitPresentationRequest({
        presentationRequest,
        selectedCredentials: selectedIds,
        disclosures:
          Object.keys(disclosures).length > 0 ? disclosures : undefined,
      })) as { redirectUri?: string } | null | undefined;

      for (const credential of selectedCredentials) {
        await recordCredentialPresented({
          credential_id: getCredentialTitle(credential),
          title: getCredentialTitle(credential),
          issuer: getCredentialIssuer(credential),
        });
        await recordVerificationResult({
          credential_id: getCredentialId(credential),
          title: getCredentialTitle(credential),
          success: true,
        });
      }

      if (result?.redirectUri) {
        router.replace(result.redirectUri as any);
      } else {
        router.replace({
          pathname: "/verification-result",
          params: {
            status: "success",
            credentialNames: selectedCredentials.map(getCredentialTitle),
          },
        });
      }
    } catch (err: any) {
      if (__DEV__) {
        console.error("Failed to submit presentation:", err);
      }

      for (const credential of selectedCredentials) {
        await recordVerificationResult({
          credential_id: getCredentialId(credential),
          title: getCredentialTitle(credential),
          success: false,
          reason: err?.message,
        }).catch(() => undefined);
      }
      setError(err?.message || "Failed to submit presentation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.verificationRequest_safeArea} edges={["top", "left", "right"]}>
        <LinearGradient
          colors={["#285CD4", "#3652DA", "#7253D4", "#B971B5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.verificationRequest_gradient}
        >
          <View style={styles.verificationRequest_loadingState}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.verificationRequest_loadingText}>Loading verification request...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.verificationRequest_safeArea} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={["#285CD4", "#3652DA", "#7253D4", "#B971B5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.verificationRequest_gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.verificationRequest_heroTitle}>Choose a credential to share</Text>
            <Text style={styles.verificationRequest_heroSubtitle}>
              This service is requesting proof from your wallet. Select what you
              want to present.
            </Text>

            {resolvedRequest?.presentation_definition?.input_descriptors?.length ? (
              <View style={styles.verificationRequest_requestCard}>
                <Text style={styles.verificationRequest_requestTitle}>Verifier request</Text>

                {resolvedRequest.presentation_definition.input_descriptors.map(
                  (descriptor, index) => (
                    <View
                      key={`${descriptor.id || "descriptor"}-${index}`}
                      style={[
                        styles.verificationRequest_requestItem,
                        index ===
                          resolvedRequest.presentation_definition!.input_descriptors!
                            .length -
                            1 && styles.verificationRequest_requestItemLast,
                      ]}
                    >
                      <Text style={styles.verificationRequest_requestLabel}>Requested</Text>
                      <Text style={styles.verificationRequest_requestText}>
                        {formatCredentialLabel(
                          descriptor.name ||
                            descriptor.id ||
                            "Requested credential"
                        )}
                      </Text>

                      {!matchedTypes.includes(
                        formatCredentialLabel(descriptor.name || descriptor.id)
                      ) ? (
                        <Text style={styles.verificationRequest_notFoundText}>Not found in wallet</Text>
                      ) : null}

                      {descriptor.purpose ? (
                        <Text style={styles.verificationRequest_requestPurpose}>
                          {descriptor.purpose}
                        </Text>
                      ) : null}
                    </View>
                  )
                )}
              </View>
            ) : null}

            {!noMatchingCredential
              ? matchedCredentials.map((credential, index) => {
                  const credentialId = getCredentialId(credential, index);
                  const isSelected = selectedIds.includes(credentialId);
                  const disclosureMap = buildDisclosureMap(credential);
                  const hasSdFields = Object.keys(disclosureMap).length > 0;
                  const saved = savedDisclosures[credentialId];
                  const onCount = saved
                    ? Object.values(saved).filter(Boolean).length
                    : Object.keys(disclosureMap).length;
                  const totalCount = Object.keys(disclosureMap).length;

                  return (
                    <Pressable
                      key={credentialId}
                      style={[
                        styles.verificationRequest_credentialCard,
                        isSelected && styles.verificationRequest_selectedCredentialCard,
                      ]}
                      onPress={() =>
                        setSelectedIds((prev) =>
                          prev.includes(credentialId)
                            ? prev.filter((id) => id !== credentialId)
                            : [...prev, credentialId]
                        )
                      }
                    >
                      <View style={styles.verificationRequest_cardTopRow}>
                        <Text style={styles.verificationRequest_credentialTitle}>
                          {getCredentialTitle(credential)}
                        </Text>

                        {isSelected ? (
                          <View style={styles.verificationRequest_selectedPill}>
                            <Text style={styles.verificationRequest_selectedPillText}>Selected</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.verificationRequest_credentialIssuer}>
                        {getCredentialIssuer(credential)}
                      </Text>

                      <Text style={styles.verificationRequest_credentialId}>
                        {credentialId || "Private"}
                      </Text>

                      {hasSdFields ? (
                        <View style={styles.verificationRequest_disclosureRow}>
                          <Text style={styles.verificationRequest_disclosureStatus}>
                            {onCount}/{totalCount} fields disclosed
                          </Text>

                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: "/select-disclosures",
                                params: {
                                  credentialId,
                                  title: getCredentialTitle(credential),
                                  disclosures: credential.disclosures ?? "",
                                },
                              })
                            }
                            style={styles.verificationRequest_detailsButton}
                          >
                            <Text style={styles.verificationRequest_detailsButtonText}>
                              Select details to disclose
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })
              : null}

            {selectedIds.length > 0 && !noMatchingCredential ? (
              <View style={styles.verificationRequest_selectionCard}>
                <Text style={styles.verificationRequest_selectionTitle}>Ready to present</Text>

                {selectedCredentials.map((credential, index) => (
                  <View key={`${getCredentialId(credential, index)}-summary`}>
                    <Text style={styles.verificationRequest_selectionText}>
                      {getCredentialTitle(credential)}
                    </Text>
                    <Text style={styles.verificationRequest_selectionTextMuted}>
                      {getCredentialIssuer(credential)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {noMatchingCredential ? (
              <View style={styles.verificationRequest_emptyStateCard}>
                <Text style={styles.verificationRequest_emptyStateTitle}>No matching credential</Text>
                <Text style={styles.verificationRequest_emptyStateText}>
                  {`No ${requestedCredentialLabel} found`}
                </Text>
                <Text style={styles.verificationRequest_emptyStateHint}>
                  Go to your credentials tab to add or review available
                  credentials.
                </Text>
              </View>
            ) : null}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.verificationRequest_actions}>
            {noMatchingCredential ? (
              <Pressable
                style={styles.verificationRequest_primaryButton}
                onPress={() => router.replace("/(tabs)/credentials")}
              >
                <Text style={styles.verificationRequest_primaryButtonText}>Go to Credentials</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.verificationRequest_primaryButton,
                  (submitting || selectedIds.length === 0) && styles.verificationRequest_disabledButton,
                ]}
                onPress={() => void handleApprove()}
                disabled={submitting || selectedIds.length === 0}
              >
                <Text style={styles.verificationRequest_primaryButtonText}>
                  {submitting ? "Submitting..." : "Approve and Present"}
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.verificationRequest_secondaryButton}
              onPress={() => router.back()}
              disabled={submitting}
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
              <Text style={styles.verificationRequest_secondaryButtonText}>Back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}