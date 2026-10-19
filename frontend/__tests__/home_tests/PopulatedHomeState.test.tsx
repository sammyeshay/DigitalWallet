import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import PopulatedHomeState from "../../components/home/PopulatedHomeState";
import { router } from "expo-router";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("../../components/home/QuickActionButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");

  return function MockQuickActionButton({
    label,
    onPress,
  }: {
    label: string;
    onPress: () => void;
  }) {
    return (
      <Pressable onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    );
  };
});

describe("PopulatedHomeState", () => {
  const defaultCredential = {
    id: "cred-1",
    title: "Director ID",
    issuer: "ABRS",
    status: "valid",
    credentialSubject: {
      name: "Max Taylor",
    },
  };

  const pendingCredential = {
    id: "cred-2",
    title: "Business Credential",
    issuer: "ASIC",
    status: "pending",
    credentialSubject: {
      name: "Alex Smith",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the default credential details and pending requests", () => {
    render(
      <PopulatedHomeState
        defaultCredential={defaultCredential as any}
        credentials={[defaultCredential as any, pendingCredential as any]}
        pendingCount={1}
        allCredentialsValid={false}
      />
    );

    expect(screen.getByText("My Credentials")).toBeTruthy();
    expect(screen.getByText("Director ID")).toBeTruthy();
    expect(screen.getByText("valid")).toBeTruthy();
    expect(screen.getByText("Max Taylor")).toBeTruthy();
    expect(screen.getByText("Pending Requests")).toBeTruthy();
    expect(screen.getByText("1 pending")).toBeTruthy();
    expect(screen.getByText("Valid")).toBeTruthy();
  });

  it("renders the fallback holder label when holder name is missing", () => {
    render(
      <PopulatedHomeState
        defaultCredential={
          {
            ...defaultCredential,
            credentialSubject: {},
          } as any
        }
        credentials={[defaultCredential as any]}
        pendingCount={0}
        allCredentialsValid={true}
      />
    );

    expect(screen.getByText("Available")).toBeTruthy();
  });

  it("renders the alert state for an unhealthy default credential", () => {
    render(
      <PopulatedHomeState
        defaultCredential={
          {
            ...defaultCredential,
            status: "revoked",
          } as any
        }
        credentials={[defaultCredential as any]}
        pendingCount={0}
        allCredentialsValid={false}
      />
    );

    expect(screen.getByText("revoked")).toBeTruthy();
    expect(screen.getByText("Check")).toBeTruthy();
  });

  it("navigates to present credential using the default credential", () => {
    render(
      <PopulatedHomeState
        defaultCredential={defaultCredential as any}
        credentials={[pendingCredential as any]}
        pendingCount={1}
        allCredentialsValid={false}
      />
    );

    fireEvent.press(screen.getByText("Present"));

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/present-credential",
      params: {
        id: "cred-1",
        title: "Director ID",
        issuer: "ABRS",
        status: "valid",
      },
    });
  });

  it("falls back to the first credential when no default credential exists", () => {
    render(
      <PopulatedHomeState
        defaultCredential={undefined}
        credentials={[pendingCredential as any]}
        pendingCount={1}
        allCredentialsValid={false}
      />
    );

    fireEvent.press(screen.getByText("Present"));

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/present-credential",
      params: {
        id: "cred-2",
        title: "Business Credential",
        issuer: "ASIC",
        status: "pending",
      },
    });
  });

  it("does nothing when present is pressed and there are no credentials", () => {
    render(
      <PopulatedHomeState
        defaultCredential={undefined}
        credentials={[]}
        pendingCount={0}
        allCredentialsValid={false}
      />
    );

    fireEvent.press(screen.getByText("Present"));

    expect(router.push).not.toHaveBeenCalled();
  });

  it("navigates to add credential when add is pressed", () => {
    render(
      <PopulatedHomeState
        defaultCredential={defaultCredential as any}
        credentials={[defaultCredential as any]}
        pendingCount={0}
        allCredentialsValid={true}
      />
    );

    fireEvent.press(screen.getByText("Add"));

    expect(router.push).toHaveBeenCalledWith("/add-credential");
  });

  it("navigates to the credential detail page when the primary card is pressed", () => {
    render(
      <PopulatedHomeState
        defaultCredential={defaultCredential as any}
        credentials={[defaultCredential as any]}
        pendingCount={0}
        allCredentialsValid={true}
      />
    );

    fireEvent.press(screen.getByText("Director ID"));

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/credential/[id]",
      params: {
        id: "cred-1",
        credential: JSON.stringify(defaultCredential),
      },
    });
  });

  it("does not render the primary card when no default credential exists", () => {
    render(
      <PopulatedHomeState
        defaultCredential={undefined}
        credentials={[pendingCredential as any]}
        pendingCount={1}
        allCredentialsValid={false}
      />
    );

    expect(screen.queryByText("Holder")).toBeNull();
    expect(screen.queryByText("Status")).toBeNull();
  });

  it("navigates to requests when the pending requests card is pressed", () => {
    render(
      <PopulatedHomeState
        defaultCredential={defaultCredential as any}
        credentials={[defaultCredential as any]}
        pendingCount={3}
        allCredentialsValid={true}
      />
    );

    fireEvent.press(screen.getByText("Pending Requests"));

    expect(router.push).toHaveBeenCalledWith("/requests");
  });
});