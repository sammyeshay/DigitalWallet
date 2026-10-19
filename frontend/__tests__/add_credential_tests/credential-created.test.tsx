import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import AddCredentialScreen from "../../src/app/add-credential";
import { router } from "expo-router";
import { previewCredentialOffer } from "../../api/credentials";

const mockRequestPermission = jest.fn();
const mockUseCameraPermissions = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock("../../components/AppHeader", () => {
  const React = jest.requireActual("react");
  const { View, Text } = jest.requireActual("react-native");

  return function MockAppHeader({ title }: { title: string }) {
    return (
      <View testID="app-header">
        <Text>{title}</Text>
      </View>
    );
  };
});

jest.mock("../../api/credentials", () => ({
  previewCredentialOffer: jest.fn(),
}));

jest.mock("expo-camera", () => {
  const React = jest.requireActual("react");
  const { View, Text } = jest.requireActual("react-native");

  return {
    CameraView: ({
      onBarcodeScanned,
    }: {
      onBarcodeScanned?: (arg: { data: string }) => void;
    }) => (
      <View testID="camera-view">
        <Text>Mock Camera</Text>

        <Text
          onPress={() =>
            onBarcodeScanned?.({
              data: "openid-credential-offer://issuer.example?credential_offer=abc",
            })
          }
        >
          Trigger Scan
        </Text>

        <Text
          onPress={() =>
            onBarcodeScanned?.({
              data: "",
            })
          }
        >
          Trigger Empty Scan
        </Text>

        <Text
          onPress={() =>
            onBarcodeScanned?.({
              data: "invalid-qr",
            })
          }
        >
          Trigger Bad Scan
        </Text>

        <Text
          onPress={() =>
            onBarcodeScanned?.({
              data: JSON.stringify({
                id: "bad-cred-1",
                title: "Unsupported Credential",
                issuer: "Unknown",
                status: "issued",
                type: ["VerifiableCredential", "UnsupportedCredential"],
                offerLink: "https://issuer.example/offer?id=bad-1",
                credentialSubject: { name: "Max Taylor" },
              }),
            })
          }
        >
          Trigger Unsupported JSON Scan
        </Text>

        <Text
          onPress={() =>
            onBarcodeScanned?.({
              data: JSON.stringify({
                id: "json-cred-1",
                offerLink: "https://issuer.example/offer?id=1",
                title: "Corporate Registration",
                issuer: "ASIC",
                status: "issued",
                type: "CorporateRegistrationCredential",
                credentialSubject: { name: "Max Taylor" },
                disclosures: "",
              }),
            })
          }
        >
          Trigger JSON Scan
        </Text>
      </View>
    ),

    useCameraPermissions: () => mockUseCameraPermissions(),
  };
});

describe("AddCredentialScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true },
      mockRequestPermission,
    ]);
  });

  it("renders the default scan tab UI", () => {
    render(<AddCredentialScreen />);

    expect(screen.getByText("Scan QR Code")).toBeTruthy();
    expect(screen.getByText("Open Link")).toBeTruthy();
    expect(screen.getByTestId("camera-view")).toBeTruthy();
    expect(screen.getByText("Mock Camera")).toBeTruthy();
    expect(
      screen.getByText(
        "Position the QR code from the issuer inside the frame to continue."
      )
    ).toBeTruthy();
  });

  it("switches to the open link tab and renders all link elements", () => {
    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));

    expect(screen.getByText("Paste issuer link")).toBeTruthy();
    expect(
      screen.getByText(
        "Add a credential by opening a supported credential offer link."
      )
    ).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Enter credential offer link")
    ).toBeTruthy();
    expect(screen.getByText("Continue")).toBeTruthy();
  });

  it("shows an error when continue is pressed with an empty link", async () => {
    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a credential offer link.")
      ).toBeTruthy();
    });

    expect(previewCredentialOffer).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("shows an error for an invalid offer link", async () => {
    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));
    fireEvent.changeText(
      screen.getByPlaceholderText("Enter credential offer link"),
      "not-a-valid-link"
    );
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "This does not look like a valid credential offer link from the issuer."
        )
      ).toBeTruthy();
    });

    expect(previewCredentialOffer).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("previews a valid link and navigates to credential form", async () => {
    (previewCredentialOffer as jest.Mock).mockResolvedValue({
      credential_id: "director-id-1",
      title: "Director ID",
      issuer: "ABRS",
      status: "pending",
      credentialSubject: { name: "Max Taylor" },
      disclosures: "",
      raw: {
        parsedDocument: {
          type: ["VerifiableCredential", "DirectorIdCredential"],
        },
      },
    });

    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));
    fireEvent.changeText(
      screen.getByPlaceholderText("Enter credential offer link"),
      "openid-credential-offer://issuer.example?credential_offer=abc"
    );
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(previewCredentialOffer).toHaveBeenCalledWith(
        "openid-credential-offer://issuer.example?credential_offer=abc"
      );
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/credential-form",
        params: {
          method: "link",
          offerLink: "openid-credential-offer://issuer.example?credential_offer=abc",
          credentialId: "director-id-1",
          credentialName: "Director ID",
          issuer: "ABRS",
          status: "pending",
          credentialType: "DirectorIdCredential",
          credentialSubject: JSON.stringify({ name: "Max Taylor" }),
          sdDisclosures: JSON.stringify({}),
        },
      });
    });
  });

  it("processes a scanned credential offer and navigates to credential form", async () => {
    (previewCredentialOffer as jest.Mock).mockResolvedValue({
      credential_id: "director-id-1",
      title: "Director ID",
      issuer: "ABRS",
      status: "pending",
      credentialSubject: { name: "Max Taylor" },
      disclosures: "",
      raw: {
        parsedDocument: {
          type: ["VerifiableCredential", "DirectorIdCredential"],
        },
      },
    });

    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Trigger Scan"));

    await waitFor(() => {
      expect(previewCredentialOffer).toHaveBeenCalledWith(
        "openid-credential-offer://issuer.example?credential_offer=abc"
      );
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/credential-form",
        params: {
          method: "scan",
          offerLink: "openid-credential-offer://issuer.example?credential_offer=abc",
          credentialId: "director-id-1",
          credentialName: "Director ID",
          issuer: "ABRS",
          status: "pending",
          credentialType: "DirectorIdCredential",
          credentialSubject: JSON.stringify({ name: "Max Taylor" }),
          sdDisclosures: JSON.stringify({}),
        },
      });
    });
  });

  it("shows the loading camera state when permission is unavailable", () => {
    mockUseCameraPermissions.mockReturnValue([undefined, mockRequestPermission]);

    render(<AddCredentialScreen />);

    expect(screen.getByText("Loading camera...")).toBeTruthy();
  });

  it("shows the permission prompt and requests access when pressed", () => {
    mockUseCameraPermissions.mockReturnValue([
      { granted: false },
      mockRequestPermission,
    ]);

    render(<AddCredentialScreen />);

    expect(screen.getByText("Camera access required")).toBeTruthy();
    expect(
      screen.getByText(
        "Tap here to allow camera access and scan a credential QR code."
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText("Camera access required"));

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });

  it("shows an error when previewing a valid link fails", async () => {
    (previewCredentialOffer as jest.Mock).mockRejectedValue(
      new Error("Network failed")
    );
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));
    fireEvent.changeText(
      screen.getByPlaceholderText("Enter credential offer link"),
      "openid-credential-offer://issuer.example?credential_offer=abc"
    );
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Unable to load this credential offer. Check that the issuer link is reachable."
        )
      ).toBeTruthy();
    });

    expect(router.push).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("clears the link error when the input changes", async () => {
    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a credential offer link.")
      ).toBeTruthy();
    });

    fireEvent.changeText(
      screen.getByPlaceholderText("Enter credential offer link"),
      "openid-credential-offer://issuer.example?credential_offer=abc"
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Please enter a credential offer link.")
      ).toBeNull();
    });
  });

  it("shows an error for an empty scanned QR code", async () => {
    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Trigger Empty Scan"));

    await waitFor(() => {
      expect(screen.getByText("The scanned QR code was empty.")).toBeTruthy();
      expect(screen.getByText("Try Again")).toBeTruthy();
    });

    expect(previewCredentialOffer).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("shows an error for a malformed QR code", async () => {
    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Trigger Bad Scan"));

    await waitFor(() => {
      expect(
        screen.getByText("This QR code is malformed or unsupported.")
      ).toBeTruthy();
    });

    expect(previewCredentialOffer).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("shows an error for an unsupported credential type in scanned JSON", async () => {
    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Trigger Unsupported JSON Scan"));

    await waitFor(() => {
      expect(
        screen.getByText("This credential type is not supported by the wallet.")
      ).toBeTruthy();
    });

    expect(router.push).not.toHaveBeenCalled();
  });

  it("clears the scan error when try again is pressed", async () => {
    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Trigger Bad Scan"));

    await waitFor(() => {
      expect(
        screen.getByText("This QR code is malformed or unsupported.")
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Try Again"));

    await waitFor(() => {
      expect(
        screen.queryByText("This QR code is malformed or unsupported.")
      ).toBeNull();
    });
  });

  it("processes a valid scanned JSON credential payload and navigates to credential form", async () => {
    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Trigger JSON Scan"));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/credential-form",
        params: {
          method: "scan",
          credentialId: "json-cred-1",
          offerLink: "https://issuer.example/offer?id=1",
          credentialName: "Corporate Registration",
          issuer: "ASIC",
          status: "issued",
          credentialType: "CorporateRegistrationCredential",
          credentialSubject: JSON.stringify({ name: "Max Taylor" }),
          sdDisclosures: JSON.stringify(""),
        },
      });
    });

    expect(previewCredentialOffer).not.toHaveBeenCalled();
  });

  it("accepts an https credential offer link", async () => {
    (previewCredentialOffer as jest.Mock).mockResolvedValue({
      credential_id: "director-id-1",
      title: "Director ID",
      issuer: "ABRS",
      status: "pending",
      credentialSubject: { name: "Max Taylor" },
      disclosures: "",
      raw: {
        parsedDocument: {
          type: ["VerifiableCredential", "DirectorIdCredential"],
        },
      },
    });

    render(<AddCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));
    fireEvent.changeText(
      screen.getByPlaceholderText("Enter credential offer link"),
      "https://issuer.example/offer?credential_offer=abc"
    );
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(previewCredentialOffer).toHaveBeenCalledWith(
        "https://issuer.example/offer?credential_offer=abc"
      );
    });
  });
});