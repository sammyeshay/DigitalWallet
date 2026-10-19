import { StyleSheet } from "react-native";
import { tokens } from "./tokens";

export const appShell = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colours.bg,
  },

  screen: {
    flex: 1,
    backgroundColor: tokens.colours.bg,
  },

  scrollContent: {
    paddingHorizontal: tokens.spacing.screenX,
    paddingTop: tokens.spacing.screenTop,
    paddingBottom: tokens.spacing.screenBottom,
  },

  card: {
    backgroundColor: tokens.colours.cardLight,
    borderRadius: tokens.radius.xxl,
    padding: 28,
    marginHorizontal: 8,
    alignItems: "center",
    ...tokens.shadows.card,
  },

  cardText: {
    fontSize: tokens.typography.bodyLg,
    color: tokens.colours.textDark,
    textAlign: "center",
  },
});