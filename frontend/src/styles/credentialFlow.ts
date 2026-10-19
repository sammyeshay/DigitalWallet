import { StyleSheet } from "react-native";
import { tokens } from "./tokens";

export const credentialFlowStyles = StyleSheet.create({
  /**
   * Layout
   */
  scrollContent: {
    paddingBottom: tokens.spacing.screenBottom,
    paddingHorizontal: tokens.spacing.screenX,
    paddingTop: tokens.spacing.screenTop,
  },

  cardCentered: {
    alignItems: "center",
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xxl,
  },

  cardStandard: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: tokens.spacing.xl,
  },

  segmentedWrap: {
    alignItems: "center",
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },

  /**
   * Hero / camera
   */
  heroCard: {
    backgroundColor: tokens.colours.cardLight,
    borderRadius: tokens.radius.card,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.lg,
    minHeight: tokens.cards.heroMinHeight,
    justifyContent: "center",
    ...tokens.shadows.softCard,
  },

  cameraShell: {
    alignItems: "center",
    justifyContent: "center",
  },

  cameraCard: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: tokens.cards.cameraMaxWidth,
    borderRadius: tokens.radius.lg,
    overflow: "hidden",
    backgroundColor: tokens.colours.white,
    alignSelf: "center",
  },

  cameraPreview: {
    width: "100%",
    height: "100%",
  },

  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: tokens.colours.overlayDark,
  },

  scanFrameOuter: {
    width: tokens.cards.cameraFrameOuter,
    height: tokens.cards.cameraFrameOuter,
    borderRadius: tokens.radius.xl,
    borderWidth: 2.5,
    borderColor: tokens.colours.white,
    alignItems: "center",
    justifyContent: "center",
  },

  scanFrameInner: {
    width: tokens.cards.cameraFrameInner,
    height: tokens.cards.cameraFrameInner,
    borderRadius: tokens.radius.scanFrame,
    borderWidth: 2,
    borderColor: tokens.colours.scanFrameMuted,
  },

  /**
   * Hero states
   */
  heroStateContainer: {
    minHeight: tokens.cards.cameraStateMinHeight,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.xxl,
  },

  heroStateTitle: {
    color: tokens.colours.textCard,
    fontSize: tokens.typography.stateTitle,
    lineHeight: tokens.typography.stateTitleLineHeight,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: tokens.spacing.sm,
  },

  heroStateText: {
    color: tokens.colours.textMuted,
    fontSize: tokens.typography.body,
    lineHeight: tokens.typography.bodyLineHeight,
    textAlign: "center",
  },

  /**
   * Link flow
   */
  linkHeroContent: {
    width: "100%",
    justifyContent: "center",
  },

  linkHeroTitle: {
    color: tokens.colours.textCard,
    fontSize: tokens.typography.title,
    lineHeight: tokens.typography.titleLineHeight,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: tokens.spacing.sm,
  },

  linkHeroText: {
    color: tokens.colours.textMuted,
    fontSize: tokens.typography.body,
    lineHeight: tokens.typography.bodyLineHeight,
    textAlign: "center",
    marginBottom: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.sm,
  },

  linkInput: {
    marginBottom: tokens.spacing.lg,
  },

  continueButton: {
    marginTop: tokens.spacing.xxs,
  },

  backButton: {
    marginTop: tokens.spacing.md,
  },

  /**
   * Supporting text
   */
  supportingText: {
    color: tokens.colours.white,
    fontSize: tokens.typography.supporting,
    lineHeight: tokens.typography.supportingLineHeight,
    textAlign: "center",
    marginTop: tokens.spacing.xl,
    marginBottom: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.xl,
  },

  scanBackButton: {
    marginTop: 0,
  },

  /**
   * Error state
   */
  errorContainer: {
    marginTop: tokens.spacing.lg,
    backgroundColor: tokens.colours.errorBg,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },

  errorText: {
    color: tokens.colours.errorText,
    fontSize: tokens.typography.error,
    lineHeight: tokens.typography.errorLineHeight,
    fontWeight: "600",
    textAlign: "center",
  },

  retryButton: {
    marginTop: tokens.spacing.md,
    alignSelf: "center",
    backgroundColor: tokens.colours.white,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
  },

  retryButtonText: {
    color: tokens.colours.errorText,
    fontSize: tokens.typography.smallButton,
    fontWeight: "700",
  },

  /**
   * Typography (shared)
   */
  sectionTitle: {
    fontSize: tokens.typography.sectionTitle,
    fontWeight: "600",
    color: tokens.colours.textMuted,
    textAlign: "left",
    marginBottom: tokens.spacing.lg,
  },

  helperText: {
    fontSize: tokens.typography.body,
    color: tokens.colours.textMuted,
    textAlign: "center",
    lineHeight: tokens.typography.bodyLineHeight,
  },

  subheading: {
    fontSize: tokens.typography.bodySmall,
    color: tokens.colours.textMuted,
    textAlign: "center",
    lineHeight: tokens.typography.bodyLineHeight,
  },

  /**
   * Divider
   */
  divider: {
    height: 1,
    backgroundColor: tokens.colours.borderSubtle,
    marginBottom: tokens.spacing.lg,
  },

  /**
   * Status
   */
  statusTextBase: {
    fontSize: tokens.typography.smallButton,
    fontWeight: "600",
    marginLeft: 6,
  },

  validStatusText: {
    color: "#34D06C",
  },

  pendingStatusText: {
    color: "#F59E0B",
  },

  expiredStatusText: {
    color: "#EF4444",
  },

  /**
   * Info rows
   */
  infoLine: {
    fontSize: tokens.typography.smallButton,
    color: tokens.colours.textMuted,
    marginBottom: tokens.spacing.xxs,
  },

  infoLabel: {
    fontWeight: "700",
    color: tokens.colours.textDark,
  },

  /**
   * Spacing helpers
   */
  actionSpacingTop: {
    marginTop: tokens.spacing.md,
  },

  actionSpacingBottom: {
    marginBottom: tokens.spacing.lg,
  },

  /**
   * Success state
   */
  successCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#35C27C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: tokens.spacing.xl,
  },

  successTick: {
    color: tokens.colours.white,
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 44,
  },

  successHeading: {
    fontSize: tokens.typography.title,
    lineHeight: tokens.typography.titleLineHeight,
    fontWeight: "800",
    color: tokens.colours.textPrimary,
    textAlign: "center",
    marginBottom: tokens.spacing.sm,
  },

  credentialFormScrollContent: {
    paddingHorizontal: tokens.spacing.xxl,
    paddingBottom: 120,
  },

  credentialFormTopSpacer: {
    height: 22,
  },

  summaryCard: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: tokens.radius.xxl,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.xl,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.softCard,
  },

  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: tokens.spacing.lg,
  },

  summaryIconWrap: {
    width: 64,
    height: 64,
    borderRadius: tokens.spacing.xl,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: tokens.buttons.smallFontSize,
  },

  summaryHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: tokens.spacing.sm,
    justifyContent: "center",
  },

  summaryTitle: {
    fontSize: tokens.typography.stateTitle,
    lineHeight: tokens.typography.stateTitleLineHeight,
    fontWeight: "800",
    color: "#111827",
    flexShrink: 1,
  },

  summaryIssuerBlock: {
    paddingLeft: 78,
  },

  summaryIssuerLabel: {
    fontSize: tokens.typography.smallButton,
    lineHeight: 18,
    color: "#6B7280",
    marginBottom: tokens.spacing.xxs,
    fontWeight: "600",
  },

  summaryIssuer: {
    fontSize: tokens.typography.body,
    lineHeight: tokens.typography.bodyLineHeight,
    color: "#1F2937",
    fontWeight: "600",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.compact,
    backgroundColor: "#E9EAFE",
    marginLeft: tokens.spacing.xs,
    flexShrink: 0,
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#6D73F5",
    marginRight: tokens.spacing.compact,
  },

  statusPillText: {
    fontSize: tokens.typography.bodySmall,
    lineHeight: 18,
    color: tokens.colours.brandBlueMid,
    fontWeight: "700",
  },

  sectionCard: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: tokens.radius.xl,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: tokens.spacing.lg,
    marginBottom: tokens.buttons.smallFontSize,
    ...tokens.shadows.softCard,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },

  sectionTitleLarge: {
    fontSize: tokens.typography.title,
    lineHeight: tokens.typography.titleLineHeight,
    fontWeight: "800",
    color: "#111827",
  },

  sectionHint: {
    fontSize: tokens.typography.bodySmall,
    lineHeight: tokens.typography.errorLineHeight,
    color: "#6B7280",
    paddingTop: tokens.spacing.md,
    paddingBottom: 2,
  },

  detailList: {
    marginTop: tokens.spacing.md,
  },

  detailRow: {
    paddingVertical: tokens.spacing.md,
    alignItems: "center",
  },

  detailLabel: {
    fontSize: tokens.typography.smallButton,
    lineHeight: 18,
    color: tokens.colours.brandBlueMid,
    fontWeight: "700",
    marginBottom: tokens.spacing.xs,
  },

  detailValue: {
    fontSize: tokens.typography.bodyLg,
    lineHeight: 25,
    color: "#111827",
    fontWeight: "600",
    textAlign: "center",
  },

  detailDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  attributesList: {
    marginTop: tokens.spacing.md,
  },

  attributeItem: {
    backgroundColor: "#F4F5FA",
    borderRadius: 22,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.buttons.smallFontSize,
    marginBottom: tokens.spacing.md,
  },

  attributeItemTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: tokens.spacing.compact,
  },

  attributeBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#8B8EF7",
    marginRight: tokens.spacing.sm,
  },

  attributeLabel: {
    fontSize: tokens.typography.body,
    lineHeight: tokens.spacing.xl,
    color: "#374151",
    fontWeight: "700",
  },

  attributeValue: {
    fontSize: tokens.typography.bodyLg,
    lineHeight: 26,
    color: "#111827",
    fontWeight: "500",
    paddingLeft: tokens.spacing.xl,
  },

  emptyAttributesCard: {
    marginTop: tokens.spacing.md,
    backgroundColor: "#F4F5FA",
    borderRadius: 22,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
  },

  emptyAttributesText: {
    fontSize: tokens.typography.bodySmall,
    lineHeight: tokens.typography.errorLineHeight,
    color: "#4B5563",
  },

  confirmButton: {
    minHeight: 64,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colours.brandBlueMid,
    marginTop: tokens.spacing.compact,
    marginBottom: tokens.buttons.smallFontSize,
    ...tokens.shadows.softCard,
  },

  confirmButtonText: {
    fontSize: tokens.typography.bodyLg,
    lineHeight: tokens.typography.errorLineHeight,
    color: tokens.colours.white,
    fontWeight: "800",
  },

  formBackButton: {
    minHeight: tokens.buttons.height,
    borderRadius: tokens.radius.pill,
    borderWidth: tokens.buttons.borderWidth,
    borderColor: tokens.colours.scanFrameMuted,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: tokens.spacing.compact,
    backgroundColor: tokens.colours.borderSubtle,
  },

  formBackButtonText: {
    color: tokens.colours.white,
    fontSize: tokens.typography.body,
    lineHeight: tokens.spacing.xl,
    fontWeight: "700",
    marginLeft: tokens.spacing.compact,
  },

  createdScreen: {
    flex: 1,
    paddingHorizontal: tokens.spacing.xxl,
  },

  createdContent: {
    flex: 1,
    justifyContent: "center",
  },

  createdCard: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: tokens.radius.card,
    paddingHorizontal: tokens.spacing.xxl,
    paddingTop: 34,
    paddingBottom: 28,
    alignItems: "center",
    ...tokens.shadows.softCard,
  },

  createdSuccessCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#3FC27A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  createdSuccessTick: {
    color: tokens.colours.white,
    fontSize: 62,
    lineHeight: 64,
    fontWeight: "700",
    marginTop: -2,
  },

  createdSuccessHeading: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "800",
    color: tokens.colours.textDark,
    textAlign: "center",
    marginBottom: tokens.buttons.smallFontSize,
  },

  createdSuccessText: {
    fontSize: tokens.typography.bodyLg,
    lineHeight: 30,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: tokens.spacing.xs,
  },

  createdPrimaryButton: {
    width: "100%",
    minHeight: 64,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colours.brandBlueMid,
    ...tokens.shadows.softCard,
  },

  createdPrimaryButtonText: {
    fontSize: tokens.typography.bodyLg,
    lineHeight: tokens.typography.errorLineHeight,
    color: tokens.colours.white,
    fontWeight: "800",
  },

  // ---------------------------------------------------------------------------
  // VerificationRequestScreen
  // ---------------------------------------------------------------------------

  verificationRequest_safeArea: {
    flex: 1,
    backgroundColor: "#285CD4",
  },

  verificationRequest_gradient: {
    flex: 1,
  },

  verificationRequest_scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },

  /** Centred spinner + label shown while the request resolves. */
  verificationRequest_loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  verificationRequest_loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    textAlign: "center",
  },

  /**
   * Frosted card that houses the entire verification request UI.
   * Uses fixed radii/padding rather than the token-based heroCard above.
   */
  verificationRequest_heroCard: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
    marginTop: 8,
    marginBottom: 22,
  },

  verificationRequest_heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  verificationRequest_heroSubtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: "#6B7280",
    marginBottom: 22,
  },

  /** Inner card listing what the verifier is asking for. */
  verificationRequest_requestCard: {
    borderRadius: 24,
    backgroundColor: "#F5F7FD",
    borderWidth: 1,
    borderColor: "#E2E8F5",
    padding: 18,
    marginBottom: 18,
  },

  verificationRequest_requestTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#4C63F0",
  },

  verificationRequest_requestItem: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF2",
  },

  /** Removes the bottom border from the last descriptor row. */
  verificationRequest_requestItemLast: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },

  verificationRequest_requestLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 6,
  },

  verificationRequest_requestText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },

  verificationRequest_requestPurpose: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    marginTop: 6,
  },

  /** Selectable credential tile. */
  verificationRequest_credentialCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#E2E8F5",
    backgroundColor: "#F8FAFF",
    padding: 18,
    marginBottom: 12,
  },

  /** Selected state override for a credential tile. */
  verificationRequest_selectedCredentialCard: {
    borderColor: "#5B6EF5",
    backgroundColor: "#F7F8FF",
    shadowColor: "#5B6EF5",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  verificationRequest_cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },

  verificationRequest_credentialTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
  },

  verificationRequest_selectedPill: {
    backgroundColor: "#E4E8FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  verificationRequest_selectedPillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4C63F0",
  },

  verificationRequest_credentialIssuer: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4B5563",
    marginBottom: 8,
  },

  verificationRequest_credentialId: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    marginBottom: 12,
  },

  verificationRequest_disclosureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 10,
  },

  verificationRequest_disclosureStatus: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    flex: 1,
    paddingRight: 8,
  },

  verificationRequest_detailsButton: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: "#5468F5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    maxWidth: 150,
    flexShrink: 0,
  },

  verificationRequest_detailsButtonText: {
    fontSize: 16,
    lineHeight: 20,
    color: "#FFFFFF",
    fontWeight: "800",
  },

  /** Summary card shown when one or more credentials are selected. */
  verificationRequest_selectionCard: {
    marginTop: 4,
    borderRadius: 24,
    backgroundColor: "#F4F6FB",
    borderWidth: 1,
    borderColor: "#E2E8F5",
    padding: 18,
  },

  verificationRequest_selectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  verificationRequest_selectionText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
    marginBottom: 4,
    textAlign: "center",
    paddingBottom: 5,
  },

  verificationRequest_selectionTextMuted: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },

  /** Shown when no wallet credential matches the request. */
  verificationRequest_emptyStateCard: {
    marginTop: 12,
    borderRadius: 24,
    backgroundColor: "#FFF7F7",
    borderWidth: 1,
    borderColor: "#F3D0D0",
    padding: 18,
  },

  verificationRequest_emptyStateTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#B42318",
    marginBottom: 8,
  },

  verificationRequest_emptyStateText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#B42318",
    marginBottom: 6,
  },

  verificationRequest_emptyStateHint: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },

  /** Inline error rendered on the gradient, outside the white card. */
  verificationRequest_errorText: {
    color: "#FFD6D6",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },

  /** Wraps the Approve / Back action buttons. */
  verificationRequest_actions: {
    gap: 12,
  },

  verificationRequest_primaryButton: {
    marginTop: 15,
    minHeight: 62,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5468F5",
  },

  verificationRequest_primaryButtonText: {
    fontSize: 18,
    lineHeight: 22,
    color: "#FFFFFF",
    fontWeight: "800",
  },

  verificationRequest_secondaryButton: {
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  verificationRequest_secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    marginLeft: 8,
  },

  /** Applied while a submission is in-flight or no credential is selected. */
  verificationRequest_disabledButton: {
    opacity: 0.7,
  },

  /** Shown below a descriptor whose credential type is absent from the wallet. */
  verificationRequest_notFoundText: {
    color: "#D14343",
    marginTop: 6,
    textAlign: "center",
  },

  // ---------------------------------------------------------------------------
  // VerificationResultScreen
  // ---------------------------------------------------------------------------

  verificationResult_safeArea: {
    flex: 1,
    backgroundColor: "#285CD4",
  },

  verificationResult_gradient: {
    flex: 1,
  },

  verificationResult_scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  /** Main frosted card centred on screen. */
  verificationResult_resultCard: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: 34,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },

  /** Pill badge displaying the outcome: Success, Cancelled, or Failed. */
  verificationResult_statusBadge: {
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },

  verificationResult_statusBadgeSuccess: {
    backgroundColor: "#DCFCE7",
  },

  verificationResult_statusBadgeCancelled: {
    backgroundColor: "#FEF3C7",
  },

  verificationResult_statusBadgeError: {
    backgroundColor: "#FEE2E2",
  },

  verificationResult_statusBadgeText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: "#111827",
  },

  verificationResult_resultTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },

  verificationResult_resultBody: {
    fontSize: 16,
    lineHeight: 25,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },

  /** Expandable card that reveals credential details on a successful result. */
  verificationResult_detailsCard: {
    borderRadius: 24,
    backgroundColor: "#F5F7FD",
    borderWidth: 1,
    borderColor: "#E2E8F5",
    padding: 16,
    marginBottom: 20,
  },

  verificationResult_detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  verificationResult_detailsHeaderTextWrap: {
    flex: 1,
  },

  verificationResult_detailsHeading: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111827",
  },

  verificationResult_detailsSubheading: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    marginTop: 4,
  },

  verificationResult_detailsBody: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F5",
  },

  /**
   * Label + value pair inside the expanded details section.
   * Distinct from the token-based detailLabel / detailValue above.
   */
  verificationResult_detailLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 8,
  },

  verificationResult_detailValue: {
    fontSize: 16,
    lineHeight: 23,
    color: "#111827",
    marginBottom: 4,
  },

  verificationResult_actions: {
    gap: 12,
  },

  verificationResult_primaryButton: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: "#5468F5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  verificationResult_primaryButtonText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  verificationResult_secondaryButton: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  verificationResult_secondaryButtonText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: "#4254D0",
  },

  /** Light bordered "Back to Home" button. */
  verificationResult_tertiaryButton: {
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#D0D7E6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
  },

  verificationResult_tertiaryButtonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    color: "#374151",
  },

  // ---------------------------------------------------------------------------
  // SelectDisclosuresScreen
  // ---------------------------------------------------------------------------

  selectDisclosures_safeArea: {
    flex: 1,
    backgroundColor: "#285CD4",
  },

  selectDisclosures_gradient: {
    flex: 1,
  },

  selectDisclosures_scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 80,
  },

  /** Frosted card wrapping all disclosure content. */
  selectDisclosures_heroCard: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
    marginTop: 8,
  },

  selectDisclosures_pageTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  selectDisclosures_pageSubtitle: {
    fontSize: 17,
    lineHeight: 28,
    color: "#6B7280",
    marginBottom: 22,
  },

  /** Shown when the credential has no selectively disclosable fields. */
  selectDisclosures_emptyStateCard: {
    borderRadius: 24,
    backgroundColor: "#F5F7FD",
    borderWidth: 1,
    borderColor: "#E2E8F5",
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  selectDisclosures_emptyStateIcon: {
    marginRight: 10,
    marginTop: 1,
  },

  selectDisclosures_noFieldsText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: "#6B7280",
  },

  /** Card wrapping the list of field toggles. */
  selectDisclosures_toggleCard: {
    borderRadius: 24,
    backgroundColor: "#F5F7FD",
    borderWidth: 1,
    borderColor: "#E2E8F5",
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 22,
  },

  selectDisclosures_toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
  },

  /** Adds a separator below every toggle row except the last. */
  selectDisclosures_toggleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF2",
  },

  selectDisclosures_toggleLabel: {
    flex: 1,
    fontSize: 17,
    lineHeight: 24,
    color: "#374151",
    fontWeight: "500",
  },

  selectDisclosures_toggleSwitch: {
    transform: [{ scaleX: 0.95 }, { scaleY: 1.08 }],
  },

  selectDisclosures_primaryButton: {
    minHeight: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5468F5",
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },

  selectDisclosures_primaryButtonText: {
    fontSize: 18,
    lineHeight: 22,
    color: "#FFFFFF",
    fontWeight: "800",
  },

  selectDisclosures_secondaryButton: {
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#5468F5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  selectDisclosures_secondaryButtonText: {
    fontSize: 18,
    lineHeight: 22,
    color: "#5468F5",
    fontWeight: "800",
  },
});