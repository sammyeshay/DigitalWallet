import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import CredentialDetailScreen from "../../src/app/credential/[id]";
import { router, useLocalSearchParams } from "expo-router";
import { fetchCredentialById } from "../../api/credentials";
import { unhashDisclosures } from "../../src/app/add-credential";

let consoleErrorSpy: jest.SpyInstance;

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock("expo-linear-gradient", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");

  return {
    LinearGradient: ({ children }: { children?: React.ReactNode }) => (
      <View testID="linear-gradient">{children}</View>
    ),
  };
});

jest.mock("../../api/credentials", () => ({
  fetchCredentialById: jest.fn(),
  STATUS_META: {
    issued: { color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
    revoked: { color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
    expired: { color: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
    pending: { color: "#6366f1", bg: "#e0e7ff", dot: "#818cf8" },
    valid: { color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
    active: { color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
  },
}));

jest.mock("../../src/app/add-credential", () => ({
  unhashDisclosures: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");

  return {
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) => (
      <View testID="safe-area-provider">{children}</View>
    ),
    SafeAreaView: ({ children }: { children?: React.ReactNode }) => (
      <View testID="safe-area-view">{children}</View>
    ),
  };
});

describe("CredentialDetailScreen", () => {
  const mockRawCredential = {
    id: "cred-123",
    parsedDocument: {
      credentialSubject: {
        name: "Max Taylor",
        directorId: "DIR-001",
      },
    },
  };

  const mockNormalisedCredential = {
    credential_id: "cred-123",
    title: "Director ID",
    issuer: "ABRS",
    status: "valid",
    offerLink: "wallet://offer/director-id",
    disclosures: "hashed-disclosures",
    credentialSubject: {
      name: "Max Taylor",
      directorId: "DIR-001",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "cred-123" });

    (fetchCredentialById as jest.Mock).mockResolvedValue({
      ...mockNormalisedCredential,
      raw: mockRawCredential,
    });

    (unhashDisclosures as jest.Mock).mockReturnValue({
      name: "Max Taylor",
      offerLink: "https://issuer.example/offer/123",
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("shows a loading state first", () => {
    (fetchCredentialById as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    render(<CredentialDetailScreen />);

    expect(screen.getByText("Loading credential...")).toBeTruthy();
  });

  it("shows an error when the credential id is missing", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    render(<CredentialDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("Credential not found")).toBeTruthy();
    });

    expect(screen.getByText("Missing credential ID.")).toBeTruthy();
    expect(screen.getByText("Back to Credentials")).toBeTruthy();
  });

  it("navigates back to credentials from the unavailable state", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    render(<CredentialDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("Back to Credentials")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Back to Credentials"));

    expect(router.replace).toHaveBeenCalledWith("/(tabs)/credentials");
  });

  it("shows an error when credential loading fails", async () => {
    (fetchCredentialById as jest.Mock).mockRejectedValue(
      new Error("Credential lookup failed")
    );

    render(<CredentialDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("Credential not found")).toBeTruthy();
    });

    expect(
      screen.getByText(
        "This credential could not be found. It may have been removed or is no longer available."
      )
    ).toBeTruthy();
    expect(screen.getByText("Back to Credentials")).toBeTruthy();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load credential details:",
      expect.any(Error)
    );
  });

  it("loads and renders credential details", async () => {
    render(<CredentialDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    expect(screen.getByText("Issued by ABRS")).toBeTruthy();
    expect(screen.getByText("Valid")).toBeTruthy();
    expect(screen.getByText("Credential details")).toBeTruthy();
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getAllByText("Max Taylor").length).toBeGreaterThan(0);
    expect(screen.getByText("Director Id")).toBeTruthy();
    expect(screen.getByText("DIR-001")).toBeTruthy();
    expect(screen.getByText("Privacy protected fields")).toBeTruthy();
    expect(screen.getByText("Tap to view sensitive details")).toBeTruthy();
    expect(screen.getByText("Back")).toBeTruthy();
  });

  it("falls back to the parsedDocument credentialSubject from raw data", async () => {
    (fetchCredentialById as jest.Mock).mockResolvedValue({
      credential_id: "cred-123",
      title: "Corporate Registration",
      issuer: "ASIC",
      status: "valid",
      offerLink: "wallet://offer/corporate-registration",
      disclosures: "hashed-disclosures",
      credentialSubject: undefined,
      raw: {
        parsedDocument: {
          credentialSubject: {
            companyName: "Acme Pty Ltd",
            abn: "12345678901",
          },
        },
      },
    });

    render(<CredentialDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("Corporate Registration")).toBeTruthy();
    });

    expect(screen.getByText("Credential details")).toBeTruthy();
    expect(screen.getByText("Company Name")).toBeTruthy();
    expect(screen.getByText("Acme Pty Ltd")).toBeTruthy();
    expect(screen.getByText("Abn")).toBeTruthy();
    expect(screen.getByText("12345678901")).toBeTruthy();
  });

  it("uses the issued status meta as a fallback for unknown statuses", async () => {
    (fetchCredentialById as jest.Mock).mockResolvedValue({
      ...mockNormalisedCredential,
      status: "mystery-status",
      raw: mockRawCredential,
    });

    render(<CredentialDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("Mystery-status")).toBeTruthy();
    });
  });

  it("shows the privacy protected fields section", async () => {
    render(<CredentialDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("Privacy protected fields")).toBeTruthy();
    });

    expect(screen.getByText("Tap to view sensitive details")).toBeTruthy();
  });

  it("renders no credential details section when credentialSubject is empty", async () => {
    (fetchCredentialById as jest.Mock).mockResolvedValue({
      ...mockNormalisedCredential,
      credentialSubject: {},
      raw: {
        parsedDocument: {
          credentialSubject: {},
        },
      },
    });

    render(<CredentialDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    expect(screen.queryByText("Credential details")).toBeNull();
    expect(screen.getByText("Privacy protected fields")).toBeTruthy();
  });

  it("navigates back when back is pressed", async () => {
    render(<CredentialDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText("Back")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Back"));

    expect(router.back).toHaveBeenCalled();
  });

  it("shows expired status when the credential is expired", async () => {
    (fetchCredentialById as jest.Mock).mockResolvedValue({
      ...mockNormalisedCredential,
      status: "expired",
      raw: mockRawCredential,
    });

    render(<CredentialDetailScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("Expired").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Expiry date: Not available")).toBeTruthy();
  });
});