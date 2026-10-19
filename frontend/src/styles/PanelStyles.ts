import { StyleSheet } from "react-native";
import { tokens } from "./tokens";

export const panelStyles = StyleSheet.create({
  section: {
    width: "100%",
    alignItems: "center",
  },

  panel: {
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
    paddingHorizontal: 24,
  },
});