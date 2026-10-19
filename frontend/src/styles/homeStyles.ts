import { StyleSheet } from "react-native";
import { tokens } from "./tokens";

/**
 * Home Screen Styles
 * -----------------------------------------------------------------------------
 * This file defines layout and visual styles for the home/dashboard screen.
 *
 * Design principles:
 * - Use tokens for all spacing, typography, and colours
 * - Prefer semantic spacing (layoutSpacing) for card/internal layout
 * - Maintain consistent card and panel patterns across the app
 */

export const homeStyles = StyleSheet.create({
  /**
   * Section wrappers
   * ---------------------------------------------------------------------------
   * Used to group content blocks within the home screen.
   */
  homeSection: {
    width: "100%",
  },

  emptyStateWrap: {
    width: "100%",
  },

  /**
   * Loading state card
   * ---------------------------------------------------------------------------
   * Displayed while credentials or data are loading.
   */
  loadingCard: {
    marginTop: tokens.spacing.compact,
    backgroundColor: tokens.colours.tabActiveBg,
    borderRadius: tokens.radius.xxl,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.xxl,
    alignItems: "center",
    ...tokens.shadows.softCard,
  },

  loadingTitle: {
    marginTop: tokens.layoutSpacing.cardBodyLg,
    marginBottom: tokens.spacing.compact,
    fontSize: tokens.typography.title,
    lineHeight: tokens.typography.titleLineHeight,
    fontWeight: "800",
    color: tokens.colours.textCard,
    textAlign: "center",
  },

  loadingText: {
    fontSize: tokens.typography.body,
    lineHeight: tokens.typography.bodyLineHeight,
    color: tokens.colours.textMutedDark,
    textAlign: "center",
  },

  /**
   * Status banner
   * ---------------------------------------------------------------------------
   * Top-level system status (e.g. wallet health, alerts, etc.)
   */
  statusBanner: {
    marginBottom: tokens.spacing.xl,
    borderRadius: tokens.radius.xl,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.layoutSpacing.cardBodyLg,
    flexDirection: "row",
    alignItems: "center",
    ...tokens.shadows.softCard,
  },

  statusBannerValid: {
    backgroundColor: "rgba(53, 94, 235, 0.95)",
  },

  statusBannerAlert: {
    backgroundColor: "rgba(75, 85, 99, 0.96)",
  },

  statusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: tokens.spacing.lg,
  },

  statusIconValid: {
    backgroundColor: "#16C76B",
  },

  statusIconAlert: {
    backgroundColor: "#F59E0B",
  },

  statusTextWrap: {
    flex: 1,
  },

  statusTitle: {
    fontSize: tokens.typography.title,
    fontWeight: "800",
    color: tokens.colours.white,
    marginBottom: tokens.spacing.xxs,
  },

  statusSubtitle: {
    fontSize: tokens.typography.bodySmall,
    lineHeight: tokens.typography.bodyLineHeight,
    color: "#D7DDFE",
  },

  /**
   * Quick action buttons row
   * ---------------------------------------------------------------------------
   * Main CTA actions on the home screen.
   */
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xxl,
  },

  actionButton: {
    flex: 1,
    backgroundColor: "rgba(22, 24, 35, 0.82)",
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    ...tokens.shadows.softCard,
  },

  actionButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colours.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: tokens.spacing.md,
  },

  actionIconWrapSecondary: {
    backgroundColor: tokens.colours.textMutedDark,
  },

  actionLabel: {
    fontSize: tokens.typography.body,
    fontWeight: "800",
    color: tokens.colours.tabText,
  },

  /**
   * Section panel
   * ---------------------------------------------------------------------------
   * Container for grouped content (cards, lists, etc.)
   */
  sectionPanel: {
    backgroundColor: "rgba(244, 245, 249, 0.97)",
    borderRadius: tokens.radius.card,
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.spacing.xl,
    paddingBottom: tokens.layoutSpacing.cardBodyLg,
    ...tokens.shadows.softCard,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: tokens.layoutSpacing.cardBodyLg,
  },

  sectionHeaderTextWrap: {
    flex: 1,
    paddingRight: tokens.spacing.md,
  },

  sectionTitle: {
    fontSize: tokens.typography.title,
    fontWeight: "800",
    marginBottom: tokens.spacing.xxs,
    color: "#202332",
  },

  sectionSubtitle: {
    fontSize: tokens.typography.bodySmall,
    lineHeight: tokens.typography.bodyLineHeight,
    color: "#6B7280",
  },

  /**
   * Primary credential card
   * ---------------------------------------------------------------------------
   * Main highlighted credential on the home screen.
   */
  primaryCard: {
    backgroundColor: tokens.colours.textCard,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.layoutSpacing.cardBodyLg,
    paddingBottom: tokens.spacing.xl,
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.softCard,
  },

  primaryCardExpiring: {
    borderColor: "#F59E0B",
    borderWidth: tokens.buttons.borderWidth,
  },

  primaryCardTitle: {
    fontSize: tokens.typography.titleLarge,
    lineHeight: tokens.typography.titleLineHeight,
    fontWeight: "800",
    color: tokens.colours.tabText,
    marginBottom: tokens.spacing.compact,
  },

  primaryCardIssuer: {
    fontSize: tokens.typography.bodySmall,
    lineHeight: tokens.typography.bodyLineHeight,
    color: "#B6B9C7",
    marginBottom: tokens.layoutSpacing.cardBodyLg,
  },

  /**
   * Secondary card (supporting info / fallback)
   */
  secondaryCard: {
    backgroundColor: tokens.colours.textCard,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.lg,
    minHeight: 118,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...tokens.shadows.softCard,
  },

  secondaryCardContent: {
    flex: 1,
    paddingRight: 12,
  },

  secondaryEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "#9CA3AF",
    marginBottom: 10,
  },

  secondaryCardTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#F1F1F5",
    marginBottom: 8,
  },

  secondaryCardBody: {
    fontSize: 16,
    lineHeight: 22,
    color: "#D3D7E6",
  },

    /**
   * Empty home state
   * ---------------------------------------------------------------------------
   * Used by EmptyHomeState when the wallet has no credentials yet.
   */
  emptyHeroPanel: {
    backgroundColor: "rgba(244, 245, 249, 0.97)",
    borderRadius: tokens.radius.card,
    paddingHorizontal: tokens.spacing.xxl,
    paddingTop: tokens.typography.errorLineHeight,
    paddingBottom: tokens.spacing.xxl,
    alignItems: "center",
    marginBottom: tokens.layoutSpacing.cardBodyLg,
    ...tokens.shadows.softCard,
  },

  emptyHeroTop: {
    width: "100%",
    alignItems: "center",
    marginBottom: tokens.spacing.compact,
  },

  emptyIconBadge: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colours.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: tokens.spacing.md,
  },

  credentialLogo: {
    width: 150,
    height: 120,
    marginBottom: tokens.typography.errorLineHeight,
  },

  title: {
    fontSize: tokens.radius.xl,
    lineHeight: 34,
    fontWeight: "800",
    color: tokens.colours.textCard,
    textAlign: "center",
    marginBottom: tokens.buttons.smallFontSize,
  },

  subtitle: {
    fontSize: tokens.typography.body,
    lineHeight: tokens.typography.errorLineHeight,
    color: tokens.colours.textMutedDark,
    textAlign: "center",
    marginBottom: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.xxs,
  },

  emptyPrimaryButton: {
    width: "100%",
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.layoutSpacing.cardBodyLg,
  },

  learnMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.xs,
  },

  footerText: {
    color: "#1131E5",
    fontSize: tokens.typography.bodySmall,
    fontWeight: "700",
    textAlign: "center",
  },
    /**
   * Health badge
   */
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.compact,
  },

  healthBadgeHealthy: {
    backgroundColor: "#2EBD59",
  },

  healthBadgeWarning: {
    backgroundColor: "#F59E0B",
  },

  healthBadgeText: {
    color: tokens.colours.white,
    fontSize: tokens.typography.tabLabel,
    fontWeight: "800",
    marginLeft: tokens.spacing.xs,
  },

  /**
   * Primary credential card internals
   */
  primaryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacing.lg,
  },

  primaryEyebrow: {
    fontSize: tokens.typography.tabLabel,
    lineHeight: tokens.spacing.lg,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "#9CA3AF",
  },

  primaryCardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  primaryCardLeft: {
    flex: 1,
    paddingRight: tokens.spacing.md,
  },

  primaryCardRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingTop: tokens.spacing.xs,
  },

  /**
   * Status pill
   */
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.compact - 1,
  },

  statusPillValid: {
    backgroundColor: "#36C95D",
  },

  statusPillAlert: {
    backgroundColor: "#EF4444",
  },

  statusPillExpiring: {
    backgroundColor: "#F59E0B",
  },

  statusPillText: {
    color: tokens.colours.white,
    fontSize: tokens.buttons.smallFontSize,
    fontWeight: "800",
    marginLeft: tokens.spacing.xs,
  },

  /**
   * Credential meta rows
   */
  metaBlock: {
    marginTop: tokens.spacing.xxs,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: tokens.spacing.sm,
  },

  metaLabel: {
    width: 64,
    fontSize: tokens.typography.bodySmall,
    lineHeight: tokens.spacing.xl,
    color: "#A0A3B1",
    fontWeight: "500",
  },

  metaValue: {
    flex: 1,
    fontSize: tokens.typography.bodySmall,
    lineHeight: tokens.spacing.xl,
    fontWeight: "600",
    color: "#F1F1F5",
  },

  metaValueStrong: {
    flex: 1,
    fontSize: tokens.typography.body,
    lineHeight: tokens.typography.errorLineHeight,
    fontWeight: "800",
  },

  validText: {
    color: "#34D06C",
  },

  alertText: {
    color: "#F59E0B",
  },

  /**
   * Empty credential fallback card
   */
  emptyCredentialCard: {
    backgroundColor: tokens.colours.textCard,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    ...tokens.shadows.softCard,
  },

  emptyCredentialIconWrap: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colours.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: tokens.buttons.smallFontSize,
  },

  emptyCredentialTextWrap: {
    flex: 1,
    paddingRight: tokens.spacing.md,
  },

  emptyCredentialTitle: {
    fontSize: tokens.typography.title,
    lineHeight: tokens.typography.titleLarge,
    fontWeight: "800",
    color: "#F1F1F5",
    marginBottom: tokens.spacing.xs,
  },

  emptyCredentialBody: {
    fontSize: tokens.typography.bodySmall,
    lineHeight: tokens.typography.errorLineHeight,
    color: "#C7CBD8",
  },
});