import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
} from "react-native";
import React, { useState, useRef, useCallback } from "react";
import type { ViewStyle, TextStyle } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import AppHeader from "../../../components/AppHeader";
import EmptyHomeState from "../../../components/home/EmptyHomeState";
import {
  deleteCredential,
  fetchCredentials,
  FrontendCredential,
  fetchCredentialById,
} from "../../../api/credentials";
import {
  recordCredentialExpired,
  recordCredentialRevoked,
} from "../../../api/activity";
import { triggerExpiryNotifications } from "../../../api/expiry-notifications";
import { EXPIRING_SOON_DAYS } from "../../../api/expiry-config";
import { styles } from "../../styles/CredentialStyles";

/**
 * Credential Type used by this screen and related UI helpers.
 */
export type Credential = {
  credential_id: string;
  title: string;
  issuer: string;
  status: string;
  offerLink: string;
};

/**
 * Visual metadata used to render status pills consistently.
 */
export const STATUS_META: Record<
  string,
  { color: string; bg: string; dot: string }
> = {
  valid: { color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
  expired: { color: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
  revoked: { color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
  pending: { color: "#6366f1", bg: "#e0e7ff", dot: "#818cf8" },
  offline: { color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
};

/**
 * Status values shown in the filter panel.
 */
const ALL_STATUSES = [
  "valid",
  "expired",
  "revoked",
  "pending",
];

/**
 * Normalised expiry state used by cards, badges and activity logging.
 */
type ExpiryState = "valid" | "expiring" | "expired" | "missing" | "invalid";
/**
 * Current filter settings applied to the credentials list.
 */
type FilterState = {
  search: string;
  statuses: Set<string>;
  types: Set<string>;
};


/**
 * Extracts the best available expiry date from a credential.
 *
 * Credentials can arrive in slightly different shapes depending on whether
 * they came from the wallet API, parsed VC document, or stored raw payload.
 */
function getExpiryDateValue(
  credential: Partial<FrontendCredential> & Record<string, any>
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
 * Converts credential status and expiry date into a display-friendly expiry state.
 */
function getExpiryState(
  credential: Partial<FrontendCredential> & Record<string, any>
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
 * Returns badge styling for credentials that are close to expiry.
 */
function getExpiryBadgeStyles(expiryState: ExpiryState): {
  container: ViewStyle;
  text: TextStyle;
  label: string;
} | null {
  if (expiryState !== "expiring") {
    return null;
  }

  return {
    label: "Expiring soon",
    container: {
      backgroundColor: "#fef3c7",
      borderColor: "#f59e0b",
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      alignSelf: "flex-start",
      marginTop: 10,
    },
    text: {
      color: "#b45309",
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  };
}

/**
 * Applies search, status and type filters to the credentials list.
 */
function applyFilters(
  credentials: FrontendCredential[],
  filters: FilterState
): FrontendCredential[] {
  let result = [...credentials];

  if (filters.search.trim() !== "") {
    const q = filters.search.toLowerCase();
    result = result.filter((cred) => {
      const title = cred.title.toLowerCase();
      const issuer = cred.issuer.toLowerCase();
      return title.includes(q) || issuer.includes(q);
    });
  }

  if (filters.statuses.size > 0) {
    result = result.filter((cred) =>
      filters.statuses.has(cred.status.trim().toLowerCase())
    );
  }

  if (filters.types.size > 0) {
    result = result.filter((cred) =>
      cred.type?.some((t) => filters.types.has(t.trim().toLowerCase()))
    );
  }

  return result;
}


/**
 * Small visual status indicator shown on each credential card.
 */
const StatusPill = ({ status }: { status: string }) => {
  const lowerStatus = String(status).trim().toLowerCase();
  const s = STATUS_META[lowerStatus] ?? STATUS_META.issued;


  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: s.dot }]} />
      <Text style={[styles.statusText, { color: s.color }]}>{status}</Text>
    </View>
  );
};

/**
 * Expandable filter panel for narrowing the credential list.
 */
const FilterPanel = ({
  onFilterChange,
  credentials,
}: {
  credentials: FrontendCredential[];
  onFilterChange: (filters: FilterState) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const animHeight = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  const availableStatuses = ALL_STATUSES;

  const activeFilterCount =
    (search.trim() ? 1 : 0) + statuses.size + types.size;

  const availableTypes = Array.from(
    new Set(
      credentials
        .flatMap((c) => c.type || [])
        .filter((t) => t.toLowerCase() !== "verifiablecredential")
        .map((t) => t.toLowerCase())
    )
  );

  /**
   * Opens or closes the animated filter panel.
   */
  const toggle = () => {
    const toOpen = !open;
    setOpen(toOpen);

    Animated.parallel([
      Animated.spring(animHeight, {
        toValue: toOpen ? 1 : 0,
        useNativeDriver: false,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(animOpacity, {
        toValue: toOpen ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  /**
   * Formats credential type strings into readable chip labels.
   */
  const formatType = (t: string) =>
    t.replace(/credential$/i, "").replace(/([A-Z])/g, " $1").trim();

  const toggleStatus = (s: string) => {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        next.delete(s);
      } else {
        next.add(s);
      }
      onFilterChange({ search, statuses: next, types });
      return next;
    });
  };

  const toggleType = (t: string) => {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {
        next.delete(t);
      } else {
        next.add(t);
      }
      onFilterChange({ search, statuses, types: next });
      return next;
    });
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    onFilterChange({ search: text, statuses, types });
  };

  const clearAll = () => {
    setSearch("");
    setStatuses(new Set());
    setTypes(new Set());
    onFilterChange({ search: "", statuses: new Set(), types: new Set() });
  };

  const expandedHeight = animHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 360],
  });

  return (
    <View style={styles.filterWrapper}>
      <TouchableOpacity
        style={[styles.filterBar, open && styles.filterBarOpen]}
        onPress={toggle}
        activeOpacity={0.85}
      >
        <View style={styles.filterBarLeft}>
          <Text style={styles.filterBarLabel}>Filter</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </View>

        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={open ? "#5468F5" : "#6B7280"}
        />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.filterPanel,
          { maxHeight: expandedHeight, opacity: animOpacity },
        ]}
        pointerEvents={open ? "auto" : "none"}
      >
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Search</Text>
          <View style={styles.filterSearchRow}>
            <TextInput
              style={styles.filterSearchInput}
              placeholder="Title or issuer"
              placeholderTextColor="#8C93A7"
              value={search}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange("")}>
                <Ionicons name="close" size={18} color="#8C93A7" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {availableStatuses.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>Status</Text>
            <View style={styles.filterChipRow}>
              {availableStatuses.map((s) => {
                const meta = STATUS_META[s];
                const active = statuses.has(s);

                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.filterChip,
                      active && {
                        borderColor: meta.dot,
                        backgroundColor: meta.bg,
                      },
                    ]}
                    onPress={() => toggleStatus(s)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.filterChipDot,
                        { backgroundColor: meta.dot },
                      ]}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        active && { color: meta.color },
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {availableTypes.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>Type</Text>
            <View style={styles.filterChipRow}>
              {availableTypes.map((t) => {
                const active = types.has(t);

                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.filterChip,
                      active && {
                        borderColor: "#818cf8",
                        backgroundColor: "#E8EAFE",
                      },
                    ]}
                    onPress={() => toggleType(t)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && { color: "#4F46E5" },
                      ]}
                    >
                      {formatType(t)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {activeFilterCount > 0 && (
          <TouchableOpacity style={styles.filterClearAll} onPress={clearAll}>
            <Text style={styles.filterClearAllText}>Clear all filters</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

/**
 * Confirmation modal shown before permanently deleting a credential.
 */
const ConfirmModal = ({
  visible,
  credentialTitle,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  credentialTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <Modal
    transparent
    animationType="fade"
    visible={visible}
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>Remove Credential</Text>
        <Text style={styles.modalBody}>Are you sure you want to remove</Text>
        <Text style={styles.modalBold}>{credentialTitle}</Text>
        <Text style={styles.modalBody}>This action cannot be undone.</Text>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalCancelBtn}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalConfirmBtn}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.modalConfirmText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

/**
 * Credential card displaying the key credential details and available actions.
 */
const CredentialCard = ({
  credential,
  onRemove,
}: {
  credential: FrontendCredential;
  onRemove: () => void;
}) => {
  const { credential_id, title, issuer, status, validFrom } = credential;
  const expiryDisplayValue = getExpiryDateValue(credential);
  const lowerStatus = String(status).trim().toLowerCase();
  const expiryState = getExpiryState(credential);
  const expiryBadge = getExpiryBadgeStyles(expiryState);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  /**
   * Opens the credential detail screen for the selected credential.
   */
  const navigateToDetail = () => {
    router.push({
      pathname: "/credential/[id]",
      params: {
        id: credential_id,
      },
    });
  };


  /**
   * Confirms removal from inside the modal, then delegates deletion to parent.
   */
  const handleConfirmRemove = () => {
    setConfirmVisible(false);
    onRemove();
  };

  return (
    <>
      <View
        style={[
          styles.credentialCard,
          lowerStatus === "revoked" && styles.credentialCardRevoked,
          expiryState === "expiring" && styles.credentialCardExpiring,
        ]}
      >
        <View style={styles.credentialTopRow}>
          <View style={styles.credentialTextBlock}>
            <Text style={styles.credentialTitle} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.credentialIssuer}>{issuer}</Text>

            {expiryBadge ? (
              <View style={expiryBadge.container}>
                <Text style={expiryBadge.text}>{expiryBadge.label}</Text>
              </View>
            ) : null}
          </View>

          <StatusPill status={status} />
        </View>

        <View style={styles.credentialDivider} />

        <View style={styles.credentialMetaRow}>
          <View style={styles.credentialMetaItem}>
            <Text style={styles.credentialMetaLabel}>Issued</Text>
            <Text style={styles.credentialMetaValue}>
              {validFrom ? formatDate(validFrom) : "—"}
            </Text>
          </View>

          <View style={styles.credentialMetaItem}>
            <Text style={styles.credentialMetaLabel}>Expiry</Text>
            <Text style={styles.credentialMetaValue}>
              {expiryDisplayValue ? formatDate(expiryDisplayValue) : "—"}
            </Text>
          </View>
        </View>

        <View style={styles.credentialDivider} />

        <View style={styles.credentialActionRow}>
          <TouchableOpacity
            style={[styles.cardActionBtn, styles.cardActionBtnNeutral]}
            onPress={navigateToDetail}
            activeOpacity={0.85}
          >
            <Text style={[styles.cardActionText, styles.cardActionTextNeutral]}>
              View Details
            </Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.cardActionBtn, styles.cardActionBtnDanger]}
            onPress={() => setConfirmVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={[styles.cardActionText, styles.cardActionTextDanger]}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ConfirmModal
        visible={confirmVisible}
        credentialTitle={title}
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmVisible(false)}
      />
    </>
  );
};

/**
 * CredentialsScreen lists stored wallet credentials.
 *
 * Responsibilities:
 * - fetch credentials from the wallet API
 * - refresh live credential status
 * - record expiry and revocation activity events
 * - trigger expiry notifications
 * - support search/type/status filtering
 * - allow detail navigation and credential removal
 */
export default function CredentialsScreen() {
  const [credentials, setCredentials] = useState<FrontendCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    statuses: new Set(),
    types: new Set(),
  });

  /**
   * Loads credentials and refreshes their current status.
   */
  const loadCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetched = await fetchCredentials();

      const withLiveStatus = await Promise.all(
        fetched.map(async (cred) => {
          try {
            const liveCredential = await fetchCredentialById(cred.credential_id);
            const previousStatus = String(cred.status ?? "")
              .trim()
              .toLowerCase();

            const updatedCredential: FrontendCredential = {
              ...cred,
              status: liveCredential.status || cred.status,
            };

            const nextStatus = String(updatedCredential.status ?? "")
              .trim()
              .toLowerCase();

            if (previousStatus !== "revoked" && nextStatus === "revoked") {
              await recordCredentialRevoked({
                credential_id: cred.credential_id,
                title: cred.title,
                issuer: cred.issuer,
                previousStatus,
              });
            }

            const expiryState = getExpiryState(updatedCredential);

            if (
              previousStatus !== "expired" &&
              nextStatus !== "revoked" &&
              expiryState === "expired"
            ) {
              await recordCredentialExpired({
                credential_id: cred.credential_id,
                title: cred.title,
                issuer: cred.issuer,
                previousStatus,
              });
            }

            return updatedCredential;
          } catch {
            const fallbackExpiryState = getExpiryState(cred);
            const previousStatus = String(cred.status ?? "")
              .trim()
              .toLowerCase();

            if (
              previousStatus !== "expired" &&
              previousStatus !== "revoked" &&
              fallbackExpiryState === "expired"
            ) {
              await recordCredentialExpired({
                credential_id: cred.credential_id,
                title: cred.title,
                issuer: cred.issuer,
                previousStatus,
              });
            }

            return cred;
          }
        })
      );

      const acceptedCredentials = withLiveStatus.filter(
        (cred) => cred.raw?.pending !== true
      );

      setCredentials(acceptedCredentials);
      await triggerExpiryNotifications(withLiveStatus);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Wallet is empty or could not connect to server.";
      setError(message);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refreshes credentials whenever this tab regains focus.
   */
  useFocusEffect(
    useCallback(() => {
      void loadCredentials();
    }, [loadCredentials])
  );


  /**
   * Deletes a credential from the wallet and removes it from local UI state.
   */
  const handleRemove = async (credentialId: string) => {
    try {
      await deleteCredential(credentialId);
      setCredentials((prev) =>
        prev.filter((c) => c.credential_id !== credentialId)
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove credential.";
      setError(message);
    }
  };

  const filteredCredentials = applyFilters(credentials, filters);
  const hasReal = credentials.length > 0;


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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
        >
          <AppHeader title="Credentials" showLogo />

          <View style={styles.body}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {!hasReal && !loading ? <EmptyHomeState /> : null}

            {hasReal && !loading ? (
              <FilterPanel
                credentials={credentials}
                onFilterChange={setFilters}
              />
            ) : null}


            {loading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#5468F5" />
                <Text style={styles.loadingTitle}>Loading credentials</Text>
                <Text style={styles.loadingText}>
                  Preparing your wallet credentials and current status.
                </Text>
              </View>
            ) : (
              <>
                {filteredCredentials.length === 0 && credentials.length > 0 ? (
                  <View style={styles.emptyResultsCard}>
                    <Text style={styles.emptyResultsTitle}>No matches</Text>
                    <Text style={styles.emptyResultsText}>
                      No credentials match the current filters.
                    </Text>
                  </View>
                ) : null}

                {filteredCredentials.map((cred) => (
                  <CredentialCard
                    key={cred.credential_id}
                    credential={cred}
                    onRemove={() => handleRemove(cred.credential_id)}
                  />
                ))}
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

