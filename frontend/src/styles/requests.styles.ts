import { StyleSheet } from "react-native";
import { tokens } from "./tokens";

export const requestsStyles = StyleSheet.create({
  requestCard: {
    backgroundColor: tokens.colours.cardLight,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F5",
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: tokens.colours.brandBlueMid,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    alignSelf: "flex-start",
  },

  requestTypeText: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 32,
    color: tokens.colours.textDark,
    marginBottom: 8,
  },

  organisationText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    color: "#4B5563",
    marginBottom: 12,
  },

  requestSubtitle: {
    fontSize: 17,
    lineHeight: 28,
    color: "#6B7280",
    marginBottom: 18,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 18,
    gap: 10,
  },

  timeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8A8F9E",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8A8F9E",
  },

  viewButton: {
    backgroundColor: tokens.colours.brandBlueMid,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 28,
    paddingVertical: 14,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  viewButtonDisabled: {
    opacity: 0.7,
  },

  viewButtonText: {
    color: tokens.colours.white,
    fontSize: 16,
    fontWeight: "800",
  },
});