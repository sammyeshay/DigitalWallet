import { StyleSheet } from "react-native";
import { tokens } from "./tokens";

export const segmentedControlStyles = StyleSheet.create({
  /**
   * Base segmented control (light version)
   */
  container: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: tokens.colours.cardLight,
    borderRadius: tokens.radius.pill,
    padding: tokens.spacing.xxs,
  },

  button: {
    flex: 1,
    borderRadius: tokens.radius.pill,
    paddingVertical: tokens.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonActive: {
    backgroundColor: tokens.colours.white,
  },

  text: {
    fontSize: tokens.typography.bodySmall,
    fontWeight: "600",
    color: tokens.colours.textMuted,
  },

  textActive: {
    color: tokens.colours.textDark,
    fontWeight: "700",
  },

  /**
   * Dark / gradient variant (used in credential flow)
   */
  tabWrap: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: tokens.colours.segmentedBg,
    borderRadius: tokens.radius.pill,
    padding: tokens.spacing.xxs,
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
    width: "100%",
    maxWidth: tokens.cards.segmentedMaxWidth,
  },

  tabButton: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  tabButtonActive: {
    backgroundColor: tokens.colours.tabActiveBg,
  },

  tabText: {
    fontSize: tokens.typography.body,
    fontWeight: "600",
    color: tokens.colours.tabText,
  },

  tabTextActive: {
    color: tokens.colours.brandBlue,
    fontWeight: "700",
  },

  /**
   * Credential flow overrides (keeps screen-specific tweaks clean)
   */
  credentialFlowContainer: {
    maxWidth: tokens.cards.segmentedMaxWidth,
  },

  credentialFlowButton: {
    minHeight: 44,
  },
});