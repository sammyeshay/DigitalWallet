import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import VerificationRequestScreen from "../../src/app/verification-request";
import { router } from "expo-router";
import {
  resolvePresentationRequest,
  matchCredentialsForPresentationDefinition,
  submitPresentationRequest,
} from "../../api/credentials";

let mockFocusEffectCalled = false;
let mockSearchParams: {
  presentationRequest?: string;
  request?: string;
  requestUri?: string;
  url?: string;
} = {};

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => mockSearchParams,
  useFocusEffect: (callback: () => void) => {
    if (!mockFocusEffectCalled) {
      mockFocusEffectCalled = true;
      callback();
    }
  },
}));

jest.mock("../../api/credentials", () => ({
  resolvePresentationRequest: jest.fn(),
  matchCredentialsForPresentationDefinition: jest.fn(),
  submitPresentationRequest: jest.fn(),
  ensureDid: jest.fn().mockResolvedValue(undefined),
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

describe("VerificationRequestScreen", () => {
  const encodedPresentationRequest = encodeURIComponent(
    "openid4vp://authorize?client_id=verifier.example&response_type=vp_token"
  );

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusEffectCalled = false;
    mockSearchParams = { presentationRequest: "" };
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("shows a loading state before the request finishes", () => {
    mockSearchParams = {
      presentationRequest: encodedPresentationRequest,
    };

    (resolvePresentationRequest as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    render(<VerificationRequestScreen />);

    expect(screen.getByText(/loading verification request/i)).toBeTruthy();
  });

  it("loads the request and renders matching credentials", async () => {
    mockSearchParams = {
      presentationRequest: encodedPresentationRequest,
    };

    (resolvePresentationRequest as jest.Mock).mockResolvedValue({
      presentation_definition: {
        input_descriptors: [
          {
            id: "DirectorIdCredential",
            name: "Director ID",
            purpose: "Prove you are a registered director",
          },
        ],
      },
    });

    (matchCredentialsForPresentationDefinition as jest.Mock).mockResolvedValue([
      {
        id: "cred-1",
        title: "Director ID",
        issuer: "ASIC",
      },
    ]);

    render(<VerificationRequestScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("Director ID").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Verifier request")).toBeTruthy();
    expect(screen.getByText("Ready to present")).toBeTruthy();
    expect(screen.getByText("Prove you are a registered director")).toBeTruthy();
  });

  it("allows selecting a different credential", async () => {
    mockSearchParams = {
      presentationRequest: encodedPresentationRequest,
    };

    (resolvePresentationRequest as jest.Mock).mockResolvedValue({
      presentation_definition: {
        input_descriptors: [
          {
            id: "CorporateRegistrationCredential",
            name: "Corporate Registration",
          },
        ],
      },
    });

    (matchCredentialsForPresentationDefinition as jest.Mock).mockResolvedValue([
      { id: "cred-1", title: "Director ID", issuer: "ASIC" },
      { id: "cred-2", title: "Corporate Registration", issuer: "ABRS" },
    ]);

    render(<VerificationRequestScreen />);

    await waitFor(() => {
      expect(
        screen.getAllByText("Corporate Registration").length
      ).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getAllByText("Corporate Registration")[0]);

    expect(
      screen.getAllByText("Corporate Registration").length
    ).toBeGreaterThan(0);
  });

  it("submits and routes to result when no redirectUri", async () => {
    mockSearchParams = {
      presentationRequest: encodedPresentationRequest,
    };

    (resolvePresentationRequest as jest.Mock).mockResolvedValue({
      presentation_definition: {
        input_descriptors: [
          {
            id: "DirectorIdCredential",
            name: "Director ID",
          },
        ],
      },
    });

    (matchCredentialsForPresentationDefinition as jest.Mock).mockResolvedValue([
      { id: "cred-1", title: "Director ID", issuer: "ASIC" },
    ]);

    (submitPresentationRequest as jest.Mock).mockResolvedValue({});

    render(<VerificationRequestScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("Director ID").length).toBeGreaterThan(0);
    });

    await act(async () => {
      fireEvent.press(screen.getByText(/approve and present/i));
    });

    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/verification-result",
      params: {
        status: "success",
        credentialNames: ["Director ID"],
      },
    });
  });

  it("routes to redirectUri when returned", async () => {
    mockSearchParams = {
      presentationRequest: encodedPresentationRequest,
    };

    (resolvePresentationRequest as jest.Mock).mockResolvedValue({
      presentation_definition: {
        input_descriptors: [
          {
            id: "DirectorIdCredential",
            name: "Director ID",
          },
        ],
      },
    });

    (matchCredentialsForPresentationDefinition as jest.Mock).mockResolvedValue([
      { id: "cred-1", title: "Director ID", issuer: "ASIC" },
    ]);

    (submitPresentationRequest as jest.Mock).mockResolvedValue({
      redirectUri: "https://example.com",
    });

    render(<VerificationRequestScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("Director ID").length).toBeGreaterThan(0);
    });

    await act(async () => {
      fireEvent.press(screen.getByText(/approve and present/i));
    });

    expect(router.replace).toHaveBeenCalledWith("https://example.com");
  });

  it("shows error when request missing", async () => {
    mockSearchParams = {
      presentationRequest: "",
    };

    render(<VerificationRequestScreen />);

    await waitFor(() => {
      expect(screen.getByText(/missing presentation request/i)).toBeTruthy();
    });
  });

  it("shows error when resolution fails", async () => {
    mockSearchParams = {
      presentationRequest: encodedPresentationRequest,
    };

    (resolvePresentationRequest as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    render(<VerificationRequestScreen />);

    await waitFor(() => {
      expect(screen.getByText("fail")).toBeTruthy();
    });
  });

  it("shows error when no presentation definition", async () => {
    mockSearchParams = {
      presentationRequest: encodedPresentationRequest,
    };

    (resolvePresentationRequest as jest.Mock).mockResolvedValue({});

    render(<VerificationRequestScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(/no presentation definition returned by backend/i)
      ).toBeTruthy();
    });
  });

  it("shows error when submit fails", async () => {
    mockSearchParams = {
      presentationRequest: encodedPresentationRequest,
    };

    (resolvePresentationRequest as jest.Mock).mockResolvedValue({
      presentation_definition: {
        input_descriptors: [
          {
            id: "DirectorIdCredential",
            name: "Director ID",
          },
        ],
      },
    });

    (matchCredentialsForPresentationDefinition as jest.Mock).mockResolvedValue([
      { id: "cred-1", title: "Director ID", issuer: "ASIC" },
    ]);

    (submitPresentationRequest as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    render(<VerificationRequestScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("Director ID").length).toBeGreaterThan(0);
    });

    await act(async () => {
      fireEvent.press(screen.getByText(/approve and present/i));
    });

    await waitFor(() => {
      expect(screen.getByText("fail")).toBeTruthy();
    });
  });

  it("goes back when back is pressed", async () => {
    mockSearchParams = {
      presentationRequest: encodedPresentationRequest,
    };

    (resolvePresentationRequest as jest.Mock).mockResolvedValue({
      presentation_definition: {
        input_descriptors: [
          {
            id: "DirectorIdCredential",
            name: "Director ID",
          },
        ],
      },
    });

    (matchCredentialsForPresentationDefinition as jest.Mock).mockResolvedValue([
      { id: "cred-1", title: "Director ID", issuer: "ASIC" },
    ]);

    render(<VerificationRequestScreen />);

    await waitFor(() => {
      expect(screen.getAllByText("Director ID").length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getByText(/^Back$/i));

    expect(router.back).toHaveBeenCalled();
  });
});