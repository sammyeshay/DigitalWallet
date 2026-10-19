import { View, Text, StyleSheet, Image } from "react-native";
import { STATUS_META } from "../api/credentials";

/**
 * Props for the CredentialSummaryCard component.
 *
 * - title: credential title (e.g. Director ID)
 * - issuer: organisation that issued the credential
 * - status: current credential status (e.g. valid, expired, pending)
 */
type CredentialSummaryCardProps = {
  title: string;
  issuer: string;
  status: string;
};

/**
 * Normalises a status string for consistent lookup.
 *
 * Behaviour:
 * - trims whitespace
 * - converts to lowercase
 *
 * This ensures compatibility with STATUS_META keys.
 *
 * @param status Raw status string
 * @returns Normalised status key
 */
function normaliseStatus(status?: string): string {
  return (status ?? "").trim().toLowerCase();
}

/**
 * Determines dynamic font sizing for the credential title
 * based on word count.
 *
 * Purpose:
 * - shorter titles appear larger and more prominent
 * - longer titles remain readable without wrapping awkwardly
 *
 * @param title Credential title
 * @returns Style object with fontSize and lineHeight
 */
function getTitleStyle(title: string) {
  const wordCount = title.split(" ").length;

  if (wordCount >= 4) {
    return { fontSize: 24, lineHeight: 28 };
  }

  if (wordCount === 3) {
    return { fontSize: 26, lineHeight: 30 };
  }

  return { fontSize: 28, lineHeight: 34 };
}

/**
 * CredentialSummaryCard
 *
 * A reusable UI component that displays a concise overview of a credential.
 *
 * Responsibilities:
 * - show credential title with adaptive sizing
 * - display issuer information
 * - render a status badge with colour-coded styling
 *
 * This component is commonly used in lists, previews, and summary views
 * throughout the wallet.
 *
 * @param props Component props
 * @returns Styled credential summary card
 */
export default function CredentialSummaryCard({
  title,
  issuer,
  status,
}: CredentialSummaryCardProps) {
  /**
   * Normalised status used to safely look up metadata.
   */
  const statusKey = normaliseStatus(status);

  /**
   * Retrieve status styling metadata (colour, background, dot).
   * Falls back to a neutral style if status is unknown.
   */
  const statusMeta =
    STATUS_META[statusKey] ?? {
      color: "#374151",
      bg: "#F3F4F6",
      dot: "#9CA3AF",
    };

  /**
   * Compute dynamic title styling based on length.
   */
  const dynamicTitle = getTitleStyle(title);

  return (
    <View style={styles.card} testID="credential-summary-card">
      {/* 
        Title row includes icon + credential name.
        Layout ensures alignment and visual hierarchy.
      */}
      <View style={styles.titleRow}>
        <Image
          source={require("../assets/Credential_Icon_Home.png")}
          style={styles.credentialIcon}
          resizeMode="contain"
        />

        <Text
          testID="credential-summary-title"
          style={[styles.title, dynamicTitle]}
        >
          {title}
        </Text>
      </View>

      <View style={styles.detailsBlock}>
        {/* Issuer information */}
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Issuer</Text>
          <Text style={styles.metaValue}>{issuer}</Text>
        </View>

        {/* Status badge */}
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Status</Text>

          <View
            testID="credential-status-badge"
            style={[
              styles.statusBadge,
              { backgroundColor: statusMeta.bg },
            ]}
          >
            {/* Coloured dot indicator */}
            <View
              testID="credential-status-dot"
              style={[
                styles.statusDot,
                { backgroundColor: statusMeta.dot },
              ]}
            />

            {/* Status text */}
            <Text
              testID="credential-status-text"
              style={[
                styles.statusText,
                { color: statusMeta.color },
              ]}
            >
              {status}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Styles for the CredentialSummaryCard.
 *
 * Covers:
 * - card container layout
 * - title and icon alignment
 * - metadata blocks
 * - status badge styling
 */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F3F4F6",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  credentialIcon: {
    width: 42,
    height: 42,
    marginRight: 12,
    marginTop: 4,
  },

  /**
   * Base title styling (dynamic size applied separately).
   */
  title: {
    flex: 1,
    fontWeight: "800",
    color: "#4F46E5",
    flexWrap: "wrap",
  },

  detailsBlock: {
    paddingLeft: 0,
  },

  metaBlock: {
    marginBottom: 18,
  },

  metaLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 6,
    textAlign: "left",
  },

  metaValue: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    alignSelf: "center",
    maxWidth: "88%",
  },

  /**
   * Status badge container.
   */
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
  },

  /**
   * Small circular indicator for status.
   */
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  /**
   * Status label text.
   */
  statusText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});