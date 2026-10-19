import React from "react";
import { Alert } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import CredentialFormScreen from "../../src/app/credential-form";
import { router, useLocalSearchParams } from "expo-router";
import * as credentialsApi from "../../api/credentials";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Ionicons: ({ name }: { name?: string }) => <Text>{name}</Text>,
  };
});

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

jest.mock("../../api/credentials", () => ({
  acceptCredential: jest.fn(),
  fetchCredentials: jest.fn(),
  isDuplicateCredential: jest.fn(),
}));

describe("CredentialFormScreen", () => {
  let alertSpy: jest.SpyInstance;

  const defaultParams = {
    method: "scan",
    offerLink: "openid-credential-offer://issuer.example?credential_offer=abc",
    credentialId: "director-id-1",
    credentialName: "Director ID",
    issuer: "ABRS",
    status: "pending",
    credentialType: "DirectorIdCredential",
    credentialSubject: JSON.stringify({
      name: "Max Taylor",
      role: "Director",
      companyName: "Taylor Holdings",
      _sd: ["ignore-me"],
    }),
    sdDisclosures: JSON.stringify({
      disclosedAddress: "123 George Street",
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());

    (useLocalSearchParams as jest.Mock).mockReturnValue(defaultParams);

    (credentialsApi.fetchCredentials as jest.Mock).mockResolvedValue([]);
    (credentialsApi.isDuplicateCredential as jest.Mock).mockReturnValue(false);
    (credentialsApi.acceptCredential as jest.Mock).mockResolvedValue({
      credential_id: "director-id-1",
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("renders the credential offer screen", () => {
    render(<CredentialFormScreen />);

    expect(
      screen.getByText(
        "Review the credential details before adding it to your wallet."
      )
    ).toBeTruthy();
    expect(screen.getByText("Director ID")).toBeTruthy();
    expect(screen.getAllByText("ABRS").length).toBeGreaterThan(0);
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.getByText("Confirm & Continue")).toBeTruthy();
  });

  it("renders collapsed helper text for details and attributes by default", () => {
    render(<CredentialFormScreen />);

    const helperTexts = screen.getAllByText("Tap to view");
    expect(helperTexts).toHaveLength(2);
  });

  it("expands credential details when pressed", () => {
    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Credential Details"));

    expect(screen.getByText("Issuer")).toBeTruthy();
    expect(screen.getAllByText("ABRS").length).toBeGreaterThan(0);
    expect(screen.getByText("Credential Type")).toBeTruthy();
    expect(screen.getByText("Director ID Credential")).toBeTruthy();
    expect(screen.getByText("Issued")).toBeTruthy();
    expect(screen.getAllByText("To be confirmed").length).toBeGreaterThan(0);
    expect(screen.getByText("Expires")).toBeTruthy();
  });

  it("expands attributes when pressed and shows parsed subject fields and SD disclosures", () => {
    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Attributes"));

    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Max Taylor")).toBeTruthy();
    expect(screen.getByText("Role")).toBeTruthy();
    expect(screen.getByText("Director")).toBeTruthy();
    expect(screen.getByText("Company Name")).toBeTruthy();
    expect(screen.getByText("Taylor Holdings")).toBeTruthy();

    expect(screen.getByText("Disclosed Address")).toBeTruthy();
    expect(screen.getByText("123 George Street")).toBeTruthy();

    expect(screen.queryByText("_sd")).toBeNull();
  });

  it("falls back safely when credentialSubject JSON is malformed", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      ...defaultParams,
      credentialSubject: "{bad-json",
    });

    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Attributes"));

    expect(screen.getByText("Disclosed Address")).toBeTruthy();
    expect(screen.queryByText("Name")).toBeNull();
  });

  it("falls back safely when sdDisclosures JSON is malformed", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      ...defaultParams,
      sdDisclosures: "{bad-json",
    });

    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Attributes"));

    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Max Taylor")).toBeTruthy();
    expect(screen.queryByText("Disclosed Address")).toBeNull();
  });

  it("falls back to Credential Offer and issuer placeholder when params are missing", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      credentialSubject: JSON.stringify({}),
      sdDisclosures: JSON.stringify({}),
    });

    render(<CredentialFormScreen />);

    expect(screen.getByText("Credential Offer")).toBeTruthy();
    expect(
      screen.getByText("Issuer details will be confirmed after acceptance")
    ).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
  });

  it("shows a Valid status pill when status is valid", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      ...defaultParams,
      status: "valid",
    });

    render(<CredentialFormScreen />);

    expect(screen.getByText("Valid")).toBeTruthy();
  });

  it("shows an Issued status pill when status is issued", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      ...defaultParams,
      status: "issued",
    });

    render(<CredentialFormScreen />);

    expect(screen.getByText("Issued")).toBeTruthy();
  });

  it("leaves unknown status labels unchanged", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      ...defaultParams,
      status: "Awaiting Review",
    });

    render(<CredentialFormScreen />);

    expect(screen.getByText("Awaiting Review")).toBeTruthy();
  });

  it("goes back when back is pressed", () => {
    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Back"));

    expect(router.back).toHaveBeenCalled();
  });

  it("shows an alert when the offer link is missing", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      ...defaultParams,
      offerLink: "",
    });

    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Confirm & Continue"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Missing offer link",
        "A credential offer link is required to receive this credential."
      );
    });

    expect(credentialsApi.fetchCredentials).not.toHaveBeenCalled();
    expect(credentialsApi.acceptCredential).not.toHaveBeenCalled();
  });

  it("shows an alert when the offer link is invalid", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      ...defaultParams,
      offerLink: "ftp://issuer.example/not-supported",
    });

    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Confirm & Continue"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid offer link",
        "This credential needs a real walt.id-backed credential offer link or QR."
      );
    });

    expect(credentialsApi.fetchCredentials).not.toHaveBeenCalled();
    expect(credentialsApi.acceptCredential).not.toHaveBeenCalled();
  });

  it("shows an alert when the pending credential id is missing", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      ...defaultParams,
      credentialId: undefined,
    });

    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Confirm & Continue"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Missing credential",
        "No pending credential was available to accept."
      );
    });

    expect(credentialsApi.fetchCredentials).not.toHaveBeenCalled();
    expect(credentialsApi.acceptCredential).not.toHaveBeenCalled();
  });

  it("filters out the same pending credential before duplicate checking", async () => {
    (credentialsApi.fetchCredentials as jest.Mock).mockResolvedValue([
      {
        credential_id: "director-id-1",
        status: "pending",
        offerLink: "openid-credential-offer://issuer.example?credential_offer=abc",
      },
      {
        credential_id: "other-1",
        status: "issued",
        offerLink: "wallet://existing",
        title: "Another Credential",
      },
    ]);

    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Confirm & Continue"));

    await waitFor(() => {
      expect(credentialsApi.isDuplicateCredential).toHaveBeenCalledWith(
        [
          {
            credential_id: "other-1",
            status: "issued",
            offerLink: "wallet://existing",
            title: "Another Credential",
          },
        ],
        {
          credentialId: "director-id-1",
          title: "Director ID",
          issuer: "ABRS",
          offerLink: "openid-credential-offer://issuer.example?credential_offer=abc",
        }
      );
    });
  });

  it("shows duplicate alert and returns to tabs when a duplicate exists", async () => {
    (credentialsApi.isDuplicateCredential as jest.Mock).mockReturnValue(true);

    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Confirm & Continue"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Credential found in wallet.",
        "Delete first to add an updated version.",
        [
          {
            text: "OK",
            onPress: expect.any(Function),
          },
        ]
      );
    });

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertArgs[2];
    buttons[0].onPress();

    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
    expect(credentialsApi.acceptCredential).not.toHaveBeenCalled();
  });

  it("accepts the credential and routes to the success screen", async () => {
    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Confirm & Continue"));

    await waitFor(() => {
      expect(credentialsApi.fetchCredentials).toHaveBeenCalled();
      expect(credentialsApi.acceptCredential).toHaveBeenCalledWith(
        "director-id-1"
      );
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/credential-created",
        params: {
          credentialId: "director-id-1",
          credentialName: "Director ID",
        },
      });
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("shows an error alert when acceptCredential throws with a message", async () => {
    (credentialsApi.acceptCredential as jest.Mock).mockRejectedValue(
      new Error("Issuer unavailable")
    );

    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Confirm & Continue"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Issuer unavailable"
      );
    });
  });

  it("shows the fallback error alert when acceptCredential throws without a message", async () => {
    (credentialsApi.acceptCredential as jest.Mock).mockRejectedValue({});

    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Confirm & Continue"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Unable to receive credential from issuer."
      );
    });
  });

  it("disables repeat submission while the accept flow is in progress", async () => {
    let resolveAccept: ((value?: unknown) => void) | undefined;

    (credentialsApi.acceptCredential as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAccept = resolve;
        })
    );

    render(<CredentialFormScreen />);

    fireEvent.press(screen.getByText("Confirm & Continue"));

    await waitFor(() => {
      expect(screen.getByText("Receiving...")).toBeTruthy();
    });

    expect(credentialsApi.acceptCredential).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText("Receiving..."));

    expect(credentialsApi.acceptCredential).toHaveBeenCalledTimes(1);

    resolveAccept?.({ credential_id: "director-id-1" });

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/credential-created",
        params: {
          credentialId: "director-id-1",
          credentialName: "Director ID",
        },
      });
    });
  });
});