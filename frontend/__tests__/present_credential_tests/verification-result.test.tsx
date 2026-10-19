import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import VerificationResultScreen from "../../src/app/verification-result";
import { router, useLocalSearchParams } from "expo-router";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock("../../components/AppHeader", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return function MockAppHeader({ title }: { title: string }) {
    return (
      <View testID="app-header">
        <Text>{title}</Text>
      </View>
    );
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Ionicons: ({ name }: { name?: string }) => <Text>{name}</Text>,
  };
});

describe("VerificationResultScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a success result with single-credential success copy", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      status: "success",
      credentialNames: "Director ID Credential",
    });

    render(<VerificationResultScreen />);

    expect(screen.getByText("Success")).toBeTruthy();
    expect(screen.getByText("Director ID Credential Presented")).toBeTruthy();
    expect(
      screen.getByText("Your credential was successfully presented to the verifier.")
    ).toBeTruthy();
    expect(screen.getByText("Credential Details")).toBeTruthy();
    expect(screen.getByText("Hidden for privacy")).toBeTruthy();
    expect(screen.getByText("View All Credentials")).toBeTruthy();
    expect(screen.getByText("Back to Home")).toBeTruthy();
    expect(screen.queryByText("View Credential")).toBeNull();
  });

  it("renders plural success title when multiple credentials were presented", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      status: "success",
      credentialNames: ["Director ID Credential", "Corporate Registration"],
    });

    render(<VerificationResultScreen />);

    expect(screen.getByText("Credentials Presented")).toBeTruthy();
    expect(
      screen.getByText("Your credential was successfully presented to the verifier.")
    ).toBeTruthy();
  });

  it("toggles credential details for a successful result", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      status: "success",
      credentialNames: "UBO Attestation Credential",
    });

    render(<VerificationResultScreen />);

    expect(screen.queryByText("Credential")).toBeNull();
    expect(screen.queryByText("UBO Attestation Credential")).toBeNull();

    fireEvent.press(screen.getByText("Credential Details"));

    expect(screen.getByText("Credential")).toBeTruthy();
    expect(screen.getByText("UBO Attestation Credential")).toBeTruthy();
    expect(screen.getByText("Tap to hide")).toBeTruthy();

    fireEvent.press(screen.getByText("Credential Details"));

    expect(screen.queryByText("Credential")).toBeNull();
    expect(screen.queryByText("Tap to hide")).toBeNull();
  });

  it("does not render credential values in expanded details when no credential names are provided", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      status: "success",
    });

    render(<VerificationResultScreen />);

    fireEvent.press(screen.getByText("Credential Details"));

    expect(screen.queryByText("Credential")).toBeNull();
    expect(screen.getByText("Credential ID")).toBeTruthy();
    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(screen.getByText("Tap to hide")).toBeTruthy();
  });

  it("renders an error result with the default message", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      status: "error",
    });

    render(<VerificationResultScreen />);

    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.getByText("Verification Failed")).toBeTruthy();
    expect(
      screen.getByText(
        "Something went wrong while presenting your credential to the verifier."
      )
    ).toBeTruthy();
    expect(screen.queryByText("Credential Details")).toBeNull();
    expect(screen.queryByText("View Credential")).toBeNull();
    expect(screen.getByText("View All Credentials")).toBeTruthy();
  });

  it("renders an error result with a custom message", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      status: "error",
      message: "Verifier rejected the presentation.",
    });

    render(<VerificationResultScreen />);

    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.getByText("Verification Failed")).toBeTruthy();
    expect(screen.getByText("Verifier rejected the presentation.")).toBeTruthy();
  });

  it("renders a cancelled result", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      status: "cancelled",
    });

    render(<VerificationResultScreen />);

    expect(screen.getByText("Cancelled")).toBeTruthy();
    expect(screen.getByText("Verification Cancelled")).toBeTruthy();
    expect(
      screen.getByText("The verification request was cancelled before completion.")
    ).toBeTruthy();
    expect(screen.queryByText("Credential Details")).toBeNull();
  });

  it("navigates to all credentials from a success result", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      status: "success",
      credentialNames: "Director ID Credential",
    });

    render(<VerificationResultScreen />);

    fireEvent.press(screen.getByText("View All Credentials"));

    expect(router.replace).toHaveBeenCalledWith("/(tabs)/credentials");
  });

  it("navigates to all credentials from an error result", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      status: "error",
    });

    render(<VerificationResultScreen />);

    fireEvent.press(screen.getByText("View All Credentials"));

    expect(router.replace).toHaveBeenCalledWith("/(tabs)/credentials");
  });

  it("navigates back home", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      status: "cancelled",
    });

    render(<VerificationResultScreen />);

    fireEvent.press(screen.getByText("Back to Home"));

    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });
});