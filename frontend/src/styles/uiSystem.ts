import { StyleSheet } from "react-native";
import { tokens } from "./tokens";

const buttonBase = {
  width: "100%" as const,
  minHeight: tokens.buttons.height,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  borderRadius: tokens.radius.pill,
};

const buttonTextBase = {
  fontWeight: tokens.buttons.fontWeight,
  fontSize: tokens.buttons.fontSize,
};

export const uiSystem = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colours.brandBlue,
  },

  safeAreaDark: {
    flex: 1,
    backgroundColor: tokens.colours.bg,
  },

  flowContainer: {
    flex: 1,
    backgroundColor: tokens.colours.bg,
  },  

  gradient: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: tokens.colours.bg,
  },

  container: {
    paddingTop: 0,
    paddingBottom: 140,
  },

  scrollContent: {
    paddingHorizontal: tokens.spacing.screenX,
    paddingTop: tokens.spacing.screenTop,
    paddingBottom: tokens.spacing.screenBottom,
  },

  contentContainer: {
    paddingHorizontal: tokens.spacing.screenX,
    paddingTop: tokens.spacing.screenTop,
  },

  body: {
    paddingHorizontal: tokens.spacing.xxl,
    paddingTop: tokens.spacing.compact,
  },

  fullscreenCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  darkScreen: {
    backgroundColor: tokens.colours.bg,
  },

  section: {
    width: "100%",
    alignItems: "center",
  },

  panel: {
    backgroundColor: "rgba(248,249,253,0.97)",
    borderRadius: tokens.radius.card,
    padding: 18,
    ...tokens.shadows.softCard,
  },

  darkPanel: {
    width: "100%",
    borderRadius: tokens.radius.lg,
    overflow: "hidden",
    backgroundColor: tokens.colours.surfaceAlt,
  },

  stateContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: tokens.spacing.xxl,
  },

  card: {
    backgroundColor: tokens.colours.cardLight,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.lg,
    marginHorizontal: tokens.spacing.compact,
    ...tokens.shadows.card,
  },

  centredCard: {
    backgroundColor: tokens.colours.cardLight,
    borderRadius: tokens.radius.xxl,
    padding: 28,
    marginHorizontal: tokens.spacing.compact,
    alignItems: "center",
    ...tokens.shadows.card,
  },

  cardText: {
    fontSize: tokens.typography.bodyLg,
    color: tokens.colours.textDark,
    textAlign: "center",
  },

  primaryButton: {
    ...buttonBase,
    backgroundColor: tokens.colours.brandBlue,
  },

  primaryButtonSml: {
    ...buttonBase,
    minHeight: tokens.buttons.compactHeight,
    backgroundColor: tokens.colours.brandBlue,
  },

  secondaryButton: {
    ...buttonBase,
    backgroundColor: tokens.colours.white,
    borderWidth: tokens.buttons.borderWidth,
    borderColor: tokens.colours.brandBlue,
  },

  primaryButtonText: {
    ...buttonTextBase,
    color: tokens.colours.white,
  },

  secondaryButtonText: {
    ...buttonTextBase,
    color: tokens.colours.brandBlue,
  },

  buttonSmlText: {
    color: tokens.colours.white,
    fontWeight: tokens.buttons.smallFontWeight,
    fontSize: tokens.buttons.smallFontSize,
  },

  retryButton: {
    marginTop: tokens.spacing.lg,
    backgroundColor: tokens.colours.brandBlueMid,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 22,
    paddingVertical: tokens.spacing.md,
  },

  retryButtonText: {
    color: tokens.colours.white,
    fontSize: tokens.typography.bodySmall,
    fontWeight: "700",
  },

  input: {
    width: "100%",
    backgroundColor: tokens.colours.surface,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colours.borderSubtle,
    color: tokens.colours.textPrimary,
    fontSize: tokens.typography.bodySmall,
  },

  disabled: {
    opacity: 0.6,
  },

  errorBanner: {
    marginTop: tokens.spacing.compact,
    marginBottom: 14,
    backgroundColor: "rgba(127, 29, 29, 0.18)",
    borderRadius: tokens.radius.input,
    borderWidth: 1,
    borderColor: "rgba(252, 165, 165, 0.35)",
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.compact,
  },

  errorBannerText: {
    flex: 1,
    fontSize: tokens.buttons.smallFontSize,
    fontWeight: "600",
    color: "#FFE3E3",
    lineHeight: 21,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
    paddingHorizontal: tokens.radius.input,
  },

  emptyTitle: {
    fontSize: tokens.typography.stateTitle,
    fontWeight: "800",
    color: tokens.colours.textDark,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.compact,
    textAlign: "center",
  },

  emptyBody: {
    fontSize: tokens.typography.bodySmall,
    lineHeight: tokens.typography.bodyLineHeight,
    color: "#6B7280",
    textAlign: "center",
  },
});