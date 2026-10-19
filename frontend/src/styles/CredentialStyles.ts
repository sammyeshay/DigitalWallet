import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // ─── Layout ───────────────────────────────────────────────────────────────

  safeArea: {
    flex: 1,
    backgroundColor: "#285CD4",
  },

  gradient: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 140,
  },

  body: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // ─── Error Banner ─────────────────────────────────────────────────────────

  errorBanner: {
    backgroundColor: "rgba(127, 29, 29, 0.18)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(252, 165, 165, 0.35)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },

  errorText: {
    color: "#FFE3E3",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },

  // ─── Loading Card ─────────────────────────────────────────────────────────

  loadingCard: {
    marginTop: 8,
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 32,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  loadingTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#1E2130",
    textAlign: "center",
  },

  loadingText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#61677A",
    textAlign: "center",
  },

  // ─── Filter Panel ─────────────────────────────────────────────────────────

  filterWrapper: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: 30,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  filterBarOpen: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  filterBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  filterBarLabel: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
  },

  filterCountBadge: {
    backgroundColor: "#5468F5",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },

  filterCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  filterPanel: {
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingBottom: 18,
  },

  filterSection: {
    marginTop: 16,
  },

  filterSectionLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  filterSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D7DCEC",
    paddingHorizontal: 14,
    minHeight: 54,
  },

  filterSearchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
    paddingVertical: 12,
  },

  filterChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D7DCEC",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  filterChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  filterChipText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "700",
  },

  filterClearAll: {
    alignSelf: "flex-start",
    marginTop: 16,
  },

  filterClearAllText: {
    color: "#5468F5",
    fontSize: 14,
    fontWeight: "700",
  },

  // ─── Empty Results ────────────────────────────────────────────────────────

  emptyResultsCard: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 14,
  },

  emptyResultsTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  emptyResultsText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#6B7280",
  },

  // ─── Credential Card ──────────────────────────────────────────────────────

  credentialCard: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  credentialCardRevoked: {
    borderColor: "#FECACA",
  },

  credentialCardExpiring: {
    borderColor: "#F59E0B",
  },

  credentialTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },

  credentialTextBlock: {
    flex: 1,
  },

  credentialTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },

  credentialIssuer: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4B5563",
  },

  credentialDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 18,
  },

  credentialMetaRow: {
    flexDirection: "row",
    gap: 16,
  },

  credentialMetaItem: {
    flex: 1,
  },

  credentialMetaLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 6,
  },

  credentialMetaValue: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
  },

  credentialActionRow: {
    flexDirection: "row",
    gap: 10,
  },

  cardActionBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },

  cardActionBtnNeutral: {
    backgroundColor: "#EEF6FF",
    borderColor: "#D5E8FF",
  },

  cardActionTextNeutral: {
    color: "#1D4ED8",
  },

  cardActionBtnDanger: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },

  cardActionTextDanger: {
    color: "#DC2626",
  },

  cardActionText: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  // ─── Status Pill ──────────────────────────────────────────────────────────

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // ─── Confirm Modal ────────────────────────────────────────────────────────

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
    textAlign: "center",
  },

  modalBody: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
    textAlign: "center",
  },

  modalBold: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginVertical: 12,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  modalCancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },

  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },

  modalConfirmBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },

  modalConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  detailsScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    marginRight: 14,
  },

  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },

  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  detailsLoadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    textAlign: "center",
  },

  errorScreen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  errorCard: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 28,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },

  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  errorTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },

  errorBody: {
    fontSize: 16,
    lineHeight: 26,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },

  summaryCard: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },

  summaryTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },

  summaryIssuer: {
    fontSize: 16,
    lineHeight: 24,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 14,
  },

  detailsStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 14,
  },

  detailsStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  detailsStatusText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },

  expiryBanner: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  expiryBannerTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
  },

  expiryBannerText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#111827",
    fontWeight: "600",
    textAlign: "center",
  },

  sectionCard: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },

  sectionEyebrow: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1.8,
    marginBottom: 8,
  },

  detailRow: {
    paddingVertical: 16,
  },

  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  detailLabelCentered: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 10,
    textAlign: "center",
  },

  detailValueCentered: {
    fontSize: 18,
    lineHeight: 30,
    color: "#111827",
    fontWeight: "700",
    textAlign: "center",
  },

  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4,
  },

  privacyHeaderTextWrap: {
    flex: 1,
    paddingRight: 12,
  },

  privacyHint: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    marginTop: -2,
    marginBottom: 4,
  },

  collapsedPrivacyText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#6B7280",
    paddingTop: 8,
    paddingBottom: 12,
  },

  privacyRow: {
    paddingVertical: 14,
  },

  privacyLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },

  privacyValue: {
    fontSize: 17,
    lineHeight: 26,
    color: "#111827",
    fontWeight: "500",
  },

  emptyDisclosureText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#6B7280",
    paddingTop: 8,
    paddingBottom: 10,
  },

  secondaryButton: {
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    marginLeft: 8,
  },

  primaryButton: {
    minHeight: 62,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5468F5",
    marginBottom: 12,
  },

  primaryButtonText: {
    fontSize: 18,
    lineHeight: 22,
    color: "#FFFFFF",
    fontWeight: "800",
  },
});