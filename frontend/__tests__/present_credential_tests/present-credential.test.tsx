//present-credential.test.tsx
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import PresentCredentialScreen from "../../src/app/present-credential";
import { router } from "expo-router";

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

jest.mock("expo-camera", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  const validRequest =
    "openid4vp://authorize?client_id=verifier.example&response_type=vp_token&response_uri=https://verifier.example/callback&request_uri=https://verifier.example/request.jwt&state=abc123&nonce=nonce123";

  return {
    CameraView: ({
      onBarcodeScanned,
    }: {
      onBarcodeScanned?: (arg: { data: string }) => void;
    }) => (
      <View testID="camera-view">
        <Text>Mock Camera</Text>
        <Text onPress={() => onBarcodeScanned?.({ data: validRequest })}>
          Trigger Valid Scan
        </Text>
        <Text onPress={() => onBarcodeScanned?.({ data: "" })}>
          Trigger Empty Scan
        </Text>
        <Text onPress={() => onBarcodeScanned?.({ data: "not-a-url" })}>
          Trigger Invalid URL Scan
        </Text>
        <Text
          onPress={() =>
            onBarcodeScanned?.({
              data: "openid4vp://authorize?response_type=vp_token&response_uri=https://verifier.example/callback&request_uri=https://verifier.example/request.jwt&state=abc123&nonce=nonce123",
            })
          }
        >
          Trigger Missing Client Id Scan
        </Text>
        <Text
          onPress={() =>
            onBarcodeScanned?.({
              data: "ftp://verifier.example?client_id=x&response_type=vp_token&response_uri=https://verifier.example/callback&request_uri=https://verifier.example/request.jwt&state=abc123&nonce=nonce123",
            })
          }
        >
          Trigger Unsupported Protocol Scan
        </Text>
      </View>
    ),
    useCameraPermissions: () => mockUseCameraPermissions(),
  };
});

describe("PresentCredentialScreen", () => {
  const validRequest =
    "openid4vp://authorize?client_id=verifier.example&response_type=vp_token&response_uri=https://verifier.example/callback&request_uri=https://verifier.example/request.jwt&state=abc123&nonce=nonce123";

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true },
      mockRequestPermission,
    ]);
  });

  it("renders the default scan tab UI", () => {
    render(<PresentCredentialScreen />);

    expect(screen.getByText("Scan QR Code")).toBeTruthy();
    expect(screen.getByText("Open Link")).toBeTruthy();
    expect(screen.getByTestId("camera-view")).toBeTruthy();
    expect(
      screen.getByText(
        "Position the QR code from the verifier inside the frame to continue."
      )
    ).toBeTruthy();
  });

  it("switches to the open link tab", () => {
    render(<PresentCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));

    expect(screen.getByText("Paste verifier link")).toBeTruthy();
    expect(
      screen.getByText(
        "Open a supported verification request link to continue to the presentation step."
      )
    ).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Enter verification request link")
    ).toBeTruthy();
    expect(screen.getByText("Continue")).toBeTruthy();
  });

  it("shows an error when the link is empty", async () => {
    render(<PresentCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(screen.getByText("The scanned QR code was empty.")).toBeTruthy();
    });

    expect(router.push).not.toHaveBeenCalled();
  });

  it("shows an error for an invalid verification URL", async () => {
    render(<PresentCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));
    fireEvent.changeText(
      screen.getByPlaceholderText("Enter verification request link"),
      "not-a-url"
    );
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "This QR code does not contain a valid verification request URL."
        )
      ).toBeTruthy();
    });
  });

  it("shows an error for unsupported protocol", async () => {
    render(<PresentCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));
    fireEvent.changeText(
      screen.getByPlaceholderText("Enter verification request link"),
      "ftp://verifier.example?client_id=x&response_type=vp_token&response_uri=https://verifier.example/callback&request_uri=https://verifier.example/request.jwt&state=abc123&nonce=nonce123"
    );
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(screen.getByText("Unsupported QR protocol: ftp:")).toBeTruthy();
    });
  });

  it("shows an error when client_id is missing", async () => {
    render(<PresentCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));
    fireEvent.changeText(
      screen.getByPlaceholderText("Enter verification request link"),
      "openid4vp://authorize?response_type=vp_token&response_uri=https://verifier.example/callback&request_uri=https://verifier.example/request.jwt&state=abc123&nonce=nonce123"
    );
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(
        screen.getByText("QR code is missing required parameter: client_id")
      ).toBeTruthy();
    });
  });

  it("navigates to verification request for a valid link", async () => {
    render(<PresentCredentialScreen />);

    fireEvent.press(screen.getByText("Open Link"));
    fireEvent.changeText(
      screen.getByPlaceholderText("Enter verification request link"),
      validRequest
    );
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/verification-request",
        params: {
          presentationRequest: encodeURIComponent(validRequest),
        },
      });
    });
  });

  it("processes a valid verifier QR scan", async () => {
    render(<PresentCredentialScreen />);

    fireEvent.press(screen.getByText("Trigger Valid Scan"));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/verification-request",
        params: {
          presentationRequest: encodeURIComponent(validRequest),
        },
      });
    });
  });

  it("shows loading camera state when permission is unavailable", () => {
    mockUseCameraPermissions.mockReturnValue([undefined, mockRequestPermission]);

    render(<PresentCredentialScreen />);

    expect(screen.getByText("Loading camera...")).toBeTruthy();
  });

  it("shows permission prompt and requests camera access", () => {
    mockUseCameraPermissions.mockReturnValue([
      { granted: false },
      mockRequestPermission,
    ]);

    render(<PresentCredentialScreen />);

    expect(screen.getByText("Camera access required")).toBeTruthy();

    fireEvent.press(screen.getByText("Camera access required"));

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });

  it("shows an error for an empty scanned QR code", async () => {
    render(<PresentCredentialScreen />);

    fireEvent.press(screen.getByText("Trigger Empty Scan"));

    await waitFor(() => {
      expect(screen.getByText("The scanned QR code was empty.")).toBeTruthy();
      expect(screen.getByText("Try Again")).toBeTruthy();
    });
  });

  it("shows an error for an invalid scanned verifier URL", async () => {
    render(<PresentCredentialScreen />);

    fireEvent.press(screen.getByText("Trigger Invalid URL Scan"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "This QR code does not contain a valid verification request URL."
        )
      ).toBeTruthy();
    });
  });

  it("shows an error for a scanned request missing client_id", async () => {
    render(<PresentCredentialScreen />);

    fireEvent.press(screen.getByText("Trigger Missing Client Id Scan"));

    await waitFor(() => {
      expect(
        screen.getByText("QR code is missing required parameter: client_id")
      ).toBeTruthy();
    });
  });

  it("clears scan error when try again is pressed", async () => {
    render(<PresentCredentialScreen />);

    fireEvent.press(screen.getByText("Trigger Invalid URL Scan"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "This QR code does not contain a valid verification request URL."
        )
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Try Again"));

    await waitFor(() => {
      expect(
        screen.queryByText(
          "This QR code does not contain a valid verification request URL."
        )
      ).toBeNull();
    });
  });
});