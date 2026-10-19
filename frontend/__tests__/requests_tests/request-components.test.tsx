import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import ActivityCard from "../../components/requests/ActivityCard";
import ErrorBanner from "../../components/requests/ErrorBanner";
import RequestCard from "../../components/requests/RequestCard";
import {
  formatActivityAction,
  formatActivityTimeLabel,
  getActivityAccentColour,
  getActivityIconName,
  isDisplayableActivity,
} from "../../src/utils/activityHelpers";

jest.mock("@expo/vector-icons", () => {
  const React = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");

  return {
    Ionicons: ({
      name,
      children,
    }: {
      name?: string;
      children?: React.ReactNode;
    }) => <Text>{children ?? name ?? "icon"}</Text>,
  };
});

describe("request components", () => {
  it("renders ErrorBanner", () => {
    render(<ErrorBanner message="Requests could not be loaded." />);

    expect(screen.getByText("Requests could not be loaded.")).toBeTruthy();
  });

  it("renders RequestCard and calls onPress", () => {
    const onPress = jest.fn();

    render(
      <RequestCard
        request={{
          id: "req-1",
          type: "pending",
          organisation: "ABRS",
          title: "Director ID request",
          subtitle: "Review and respond to this request.",
          icon: "document-text-outline",
          statusColour: "#22c55e",
          statusLabel: "Pending",
        }}
        onPress={onPress}
      />
    );

    expect(screen.getByText("Director ID request")).toBeTruthy();
    expect(screen.getByText("ABRS")).toBeTruthy();
    expect(screen.getByText("Action")).toBeTruthy();

    fireEvent.press(screen.getByText("Action"));
    expect(onPress).toHaveBeenCalled();
  });

  it("renders ActivityCard and calls onPress", () => {
    const onPress = jest.fn();

    render(
      <ActivityCard
        activity={{
          id: "activity-1",
          credentialId: "cred-1",
          credentialTitle: "Director ID",
          actionType: "credential_presented",
          timestamp: "2026-04-17T10:00:00.000Z",
          source: "verifier",
          summary: "Shared with verifier",
          metadata: { issuer: "ABRS" },
        }}
        isOpening={false}
        onPress={onPress}
      />
    );

    expect(screen.getByText("Director ID")).toBeTruthy();
    expect(screen.getByText("Shared with verifier")).toBeTruthy();
    expect(screen.getByText("View Credential")).toBeTruthy();

    fireEvent.press(screen.getByText("View Credential"));
    expect(onPress).toHaveBeenCalled();
  });

  it("shows Opening... state in ActivityCard", () => {
    render(
      <ActivityCard
        activity={{
          id: "activity-1",
          credentialId: "cred-1",
          credentialTitle: "Director ID",
          actionType: "credential_presented",
          timestamp: "2026-04-17T10:00:00.000Z",
          source: "verifier",
        }}
        isOpening
        onPress={jest.fn()}
      />
    );

    expect(screen.getByText("Opening...")).toBeTruthy();
  });
});

describe("activityHelpers", () => {
  it("formats activity actions", () => {
    expect(formatActivityAction("credential_presented")).toBe(
      "Credential presented"
    );
    expect(formatActivityAction("verification_success")).toBe(
      "Verification successful"
    );
    expect(formatActivityAction("verification_failure")).toBe(
      "Verification failed"
    );
    expect(formatActivityAction("status_changed")).toBe("Status changed");
    expect(formatActivityAction("credential_expired")).toBe(
      "Credential expired"
    );
    expect(formatActivityAction("credential_revoked")).toBe(
      "Credential revoked"
    );
    expect(formatActivityAction("credential_updated")).toBe(
      "Credential updated"
    );
    expect(formatActivityAction("something_else" as any)).toBe(
      "Activity recorded"
    );
  });

  it("returns correct icon names", () => {
    expect(getActivityIconName("credential_presented")).toBe(
      "share-social-outline"
    );
    expect(getActivityIconName("verification_success")).toBe(
      "checkmark-done-outline"
    );
    expect(getActivityIconName("verification_failure")).toBe(
      "close-circle-outline"
    );
    expect(getActivityIconName("status_changed")).toBe(
      "swap-horizontal-outline"
    );
    expect(getActivityIconName("credential_expired")).toBe("time-outline");
    expect(getActivityIconName("credential_revoked")).toBe("ban-outline");
    expect(getActivityIconName("credential_updated")).toBe("create-outline");
    expect(getActivityIconName("unknown" as any)).toBe(
      "document-text-outline"
    );
  });

  it("returns correct accent colours", () => {
    expect(getActivityAccentColour("verification_success")).toBe("#16A34A");
    expect(getActivityAccentColour("verification_failure")).toBe("#DC2626");
    expect(getActivityAccentColour("credential_revoked")).toBe("#DC2626");
    expect(getActivityAccentColour("credential_expired")).toBe("#B45309");
    expect(getActivityAccentColour("credential_presented")).toBe("#4E6CF6");
    expect(getActivityAccentColour("status_changed")).toBe("#7C3AED");
    expect(getActivityAccentColour("credential_updated")).toBe("#7C3AED");
    expect(getActivityAccentColour("other" as any)).toBe("#5B6FF5");
  });

  it("formats valid timestamps and handles invalid ones", () => {
    expect(formatActivityTimeLabel("not-a-date")).toBe("Unknown time");
    expect(formatActivityTimeLabel("2026-04-17T10:00:00.000Z")).not.toBe(
      "Unknown time"
    );
  });

  it("validates displayable activity objects", () => {
    expect(
      isDisplayableActivity({
        id: "activity-1",
        credentialId: "cred-1",
        credentialTitle: "Director ID",
        actionType: "credential_presented",
        timestamp: "2026-04-17T10:00:00.000Z",
      } as any)
    ).toBe(true);

    expect(isDisplayableActivity(null)).toBe(false);
    expect(isDisplayableActivity(undefined)).toBe(false);

    expect(
      isDisplayableActivity({
        id: "",
        credentialId: "cred-1",
        credentialTitle: "Director ID",
        actionType: "credential_presented",
        timestamp: "2026-04-17T10:00:00.000Z",
      } as any)
    ).toBe(false);

    expect(
      isDisplayableActivity({
        id: "activity-1",
        credentialId: "",
        credentialTitle: "Director ID",
        actionType: "credential_presented",
        timestamp: "2026-04-17T10:00:00.000Z",
      } as any)
    ).toBe(false);

    expect(
      isDisplayableActivity({
        id: "activity-1",
        credentialId: "cred-1",
        credentialTitle: "",
        actionType: "credential_presented",
        timestamp: "2026-04-17T10:00:00.000Z",
      } as any)
    ).toBe(false);
  });
});