import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { FrontendCredential } from "../../api/credentials";
import QuickActionButton from "./QuickActionButton";
import { homeStyles as styles } from "../../src/styles/homeStyles";
import { isHealthyStatus, getExpiryState } from "./home.helpers";

/**
 * Props for the PopulatedHomeState component.
 *
 * - defaultCredential: primary credential to highlight (e.g. Director ID)
 * - credentials: full list of credentials in the wallet
 * - pendingCount: number of pending verification requests
 * - allCredentialsValid: whether all credentials are in a healthy state
 */
type Props = {
  defaultCredential?: FrontendCredential;
  credentials: FrontendCredential[];
  pendingCount: number;
  allCredentialsValid: boolean;
};

/**
 * PopulatedHomeState
 *
 * Displays the home screen when the user has at least one credential.
 *
 * Responsibilities:
 * - surface quick actions (present + add credential)
 * - highlight a primary/default credential
 * - show credential health and expiry status
 * - provide access to pending requests
 *
 * @param props Component props
 * @returns React Native populated home state UI
 */
export default function PopulatedHomeState({
  defaultCredential,
  credentials,
  pendingCount,
  allCredentialsValid,
}: Props) {
  /**
   * Display status text for the primary credential.
   * Falls back to "Not added" if no credential exists.
   */
  const statusText = defaultCredential?.status || "Not added";

  /**
   * Determines if the primary credential is in a healthy/valid state.
   */
  const statusIsHealthy = defaultCredential
    ? isHealthyStatus(defaultCredential.status)
    : false;

  /**
   * Computes expiry state for the primary credential.
   */
  const expiryState = getExpiryState(defaultCredential);

  /**
   * Flag used to highlight credentials that are close to expiry.
   */
  const isExpiringSoon = expiryState === "expiring";


  return (
    <View style={styles.homeSection}>
      {/* 
        Quick action buttons:
        - Present: share a credential with a verifier
        - Add: initiate credential issuance flow
      */}
      <View style={styles.actionsRow}>
        <QuickActionButton
          icon="qr-code-outline"
          label="Present"
          onPress={() => {
            /**
             * Use the default credential if available,
             * otherwise fall back to the first credential in the list.
             */
            const credentialToPresent = defaultCredential ?? credentials[0];
            if (!credentialToPresent) return;

            router.push({
              pathname: "/present-credential",
              params: {
                id: credentialToPresent.id,
                title: credentialToPresent.title ?? "",
                issuer: credentialToPresent.issuer ?? "",
                status: credentialToPresent.status ?? "",
              },
            });
          }}
        />

        <QuickActionButton
          icon="scan-outline"
          label="Add"
          onPress={() => router.push("/add-credential")}
        />
      </View>

      {/* 
        Credentials surface:
        A large light panel floating on the gradient background.
      */}
      <View style={styles.sectionPanel}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderTextWrap}>
            <Text style={styles.sectionTitle}>My Credentials</Text>
          </View>

          <View
            style={[
              styles.healthBadge,
              allCredentialsValid
                ? styles.healthBadgeHealthy
                : styles.healthBadgeWarning,
            ]}
          >
            <Ionicons
              name={allCredentialsValid ? "checkmark-circle" : "alert-circle"}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.healthBadgeText}>
              {allCredentialsValid ? "Healthy" : "Review"}
            </Text>
          </View>
        </View>

        {/* 
          Primary credential card:
          Displays the user's main credential (e.g. Director ID)
        */}
        {defaultCredential ? (
          <Pressable
            style={[
              styles.primaryCard,
              isExpiringSoon && styles.primaryCardExpiring,
            ]}
            onPress={() => {
              /**
               * Navigate to credential detail screen.
               * Pass both id and serialised credential for robustness.
               */
              if (!defaultCredential.id) return;
              router.push({
                pathname: "/credential/[id]",
                params: {
                  id: defaultCredential.id,
                  credential: JSON.stringify(defaultCredential),
                },
              })
            }}
          >
            <View style={styles.primaryCardHeader}>
              <Text style={styles.primaryEyebrow}>PRIMARY CREDENTIAL</Text>

              <View
                style={[
                  styles.statusPill,
                  isExpiringSoon
                    ? styles.statusPillExpiring
                    : statusIsHealthy
                    ? styles.statusPillValid
                    : styles.statusPillAlert,
                ]}
              >
                <Ionicons
                  name={
                    isExpiringSoon
                      ? "time-outline"
                      : statusIsHealthy
                      ? "checkmark"
                      : "alert"
                  }
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.statusPillText}>
                  {isExpiringSoon
                    ? "Expiring"
                    : statusIsHealthy
                    ? "Valid"
                    : "Check"}
                </Text>
              </View>
            </View>

            <View style={styles.primaryCardBody}>
              <View style={styles.primaryCardLeft}>
                {/* Credential title */}
                <Text style={styles.primaryCardTitle}>
                  {defaultCredential.title}
                </Text>

                {/* Credential issuer, optional but useful visually */}
                <Text style={styles.primaryCardIssuer}>
                  {defaultCredential.issuer || "Trusted issuer"}
                </Text>

                {/* Credential meta rows */}
                <View style={styles.metaBlock}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Status</Text>
                    <Text
                      style={[
                        styles.metaValueStrong,
                        statusIsHealthy ? styles.validText : styles.alertText,
                      ]}
                    >
                      {statusText}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Holder</Text>
                    <Text style={styles.metaValue}>
                      {defaultCredential.credentialSubject?.name || "Available"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.primaryCardRight}>
                <Ionicons
                  name="chevron-forward"
                  size={30}
                  color="#B8B8C7"
                />
              </View>
            </View>
          </Pressable>
        ) : (
          <Pressable
            style={styles.emptyCredentialCard}
            onPress={() => router.push("/add-credential")}
          >
            <View style={styles.emptyCredentialIconWrap}>
              <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
            </View>

            <View style={styles.emptyCredentialTextWrap}>
              <Text style={styles.emptyCredentialTitle}>
                Add your first credential
              </Text>
              <Text style={styles.emptyCredentialBody}>
                Scan a QR code or open an issuer link to get started.
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={30} color="#B8B8C7" />
          </Pressable>
        )}

        {/* 
          Pending requests card:
          Shows number of outstanding verification or sharing requests.
        */}
        <Pressable
          style={styles.secondaryCard}
          onPress={() => router.push("/requests")}
        >
          <View style={styles.secondaryCardContent}>
            <Text style={styles.secondaryEyebrow}>REQUESTS</Text>
            <Text style={styles.secondaryCardTitle}>Pending Requests</Text>
            <Text style={styles.secondaryCardBody}>{pendingCount} pending</Text>
          </View>

          <Ionicons name="chevron-forward" size={30} color="#B8B8C7" />
        </Pressable>
      </View>
    </View>
  );
}