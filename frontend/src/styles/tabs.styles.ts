import { StyleSheet } from "react-native";
import { tokens } from "./tokens";

export const tabsStyles = StyleSheet.create({
  label: {
    fontSize: tokens.typography.tabLabel,
    fontWeight: "600",
    marginTop: 2,
  },

  icon: {
    marginTop: 4,
  },

  item: {
    paddingVertical: 8,
  },

  tabBar: {
    position: "absolute",
    left: tokens.tabBar.sideInset,
    right: tokens.tabBar.sideInset,
    bottom: tokens.tabBar.bottom,
    height: tokens.tabBar.height,
    borderTopWidth: 0,
    borderRadius: tokens.radius.xl,
    backgroundColor: "transparent",
    ...tokens.shadows.floating,
  },

  background: {
    flex: 1,
    borderRadius: tokens.radius.xl,
    borderWidth: 1,
    borderColor: tokens.colours.borderSubtle,
  },
});