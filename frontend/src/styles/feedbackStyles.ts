import { StyleSheet } from "react-native";
import { tokens } from "./tokens";

export const feedbackStyles = StyleSheet.create({
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: tokens.colours.textSecondary,
    textAlign: "center",
  },

  mutedText: {
    fontSize: 14,
    lineHeight: 21,
    color: tokens.colours.textSecondary,
    textAlign: "center",
  },

  errorText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#D14343",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: tokens.colours.textDark,
    textAlign: "center",
  },
});