import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { fetchCredentials } from "../../api/credentials";
import {
  fetchRequests,
  syncRequestsFromCredentials,
  completeRequest,
  markRequestAsRead,
  getRequestTimeLabel,
} from "../../api/requests";
import { router } from "expo-router";

import RequestsScreen from "../../src/app/(tabs)/requests";

const focusCallbacks: (() => void)[] = [];

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void) => {
    focusCallbacks.push(callback);
  },
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

jest.mock("../../api/credentials", () => ({
  fetchCredentials: jest.fn(),
}));

jest.mock("../../api/requests", () => ({
  fetchRequests: jest.fn(),
  syncRequestsFromCredentials: jest.fn(),
  completeRequest: jest.fn(),
  markRequestAsRead: jest.fn(),
  getRequestTimeLabel: jest.fn(),
}));

const mockRequests = [
  {
    id: "req-1",
    type: "pending",
    organisation: "ABRS",
    title: "Director ID request",
    subtitle: "Review and respond to this request.",
    icon: "document-text-outline",
    statusColour: "#22c55e",
    statusLabel: "Pending",
  },
  {
    id: "req-2",
    type: "past",
    organisation: "ASIC",
    title: "AML verification",
    subtitle: "This request has been completed.",
    icon: "checkmark-circle-outline",
    statusColour: "#9ca3af",
    statusLabel: "Completed",
  },
];

const expiryPendingRequest = {
  id: "req-expiry-pending",
  type: "pending",
  organisation: "ABRS",
  title: "Credential expiring soon",
  subtitle: "Your credential will expire soon.",
  icon: "alert-circle-outline",
  statusColour: "#f59e0b",
  statusLabel: "Expiring",
  source: "credential_expiry",
  credentialId: "cred-123",
};

const expiryPastRequest = {
  id: "req-expiry-past",
  type: "past",
  organisation: "ASIC",
  title: "Expired credential",
  subtitle: "This credential has expired.",
  icon: "time-outline",
  statusColour: "#ef4444",
  statusLabel: "Expired",
  source: "credential_expiry",
  credentialId: "cred-456",
};

const expiryPendingNoCredentialId = {
  id: "req-expiry-no-id",
  type: "pending",
  organisation: "ABRS",
  title: "Credential expiring",
  subtitle: "No linked credential id.",
  icon: "alert-outline",
  statusColour: "#f59e0b",
  statusLabel: "Expiring",
  source: "credential_expiry",
};

async function renderAndTriggerFocus() {
  render(<RequestsScreen />);

  await act(async () => {
    for (const callback of focusCallbacks) {
      callback();
    }
  });
}

describe("RequestsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    focusCallbacks.length = 0;

    (fetchCredentials as jest.Mock).mockResolvedValue([]);
    (syncRequestsFromCredentials as jest.Mock).mockResolvedValue(undefined);
    (fetchRequests as jest.Mock).mockResolvedValue([]);
    (completeRequest as jest.Mock).mockResolvedValue(undefined);
    (markRequestAsRead as jest.Mock).mockResolvedValue(undefined);
    (getRequestTimeLabel as jest.Mock).mockReturnValue("Just now");
  });

  it("renders the requests header", async () => {
    await renderAndTriggerFocus();

    expect(screen.getByText("Requests")).toBeTruthy();
  });

  it("shows the loading state before requests finish loading", () => {
    (fetchCredentials as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<RequestsScreen />);

    expect(screen.getByText("Loading requests")).toBeTruthy();
    expect(
      screen.getByText("Syncing credential notifications and request history.")
    ).toBeTruthy();
  });

  it("shows the empty pending state", async () => {
    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("No pending requests")).toBeTruthy();
    });
  });

  it("shows the empty past state after switching tabs", async () => {
    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("No pending requests")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Past"));

    await waitFor(() => {
      expect(screen.getByText("No past requests")).toBeTruthy();
    });
  });

  it("renders pending requests", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue(mockRequests);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID request")).toBeTruthy();
    });

    expect(screen.getByText("ABRS")).toBeTruthy();
    expect(screen.getByText("Action")).toBeTruthy();
  });

  it("renders the request time label", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue([mockRequests[0]]);
    (getRequestTimeLabel as jest.Mock).mockReturnValue("2 hours ago");

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("2 hours ago")).toBeTruthy();
    });

    expect(getRequestTimeLabel).toHaveBeenCalledWith(mockRequests[0]);
  });

  it("switches to past requests", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue(mockRequests);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID request")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Past"));

    await waitFor(() => {
      expect(screen.getByText("AML verification")).toBeTruthy();
    });

    expect(screen.getByText("View")).toBeTruthy();
  });

  it("handles viewing a pending request", async () => {
    (fetchRequests as jest.Mock)
      .mockResolvedValueOnce(mockRequests)
      .mockResolvedValueOnce(mockRequests);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID request")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Action"));

    await waitFor(() => {
      expect(markRequestAsRead).toHaveBeenCalledWith("req-1");
      expect(completeRequest).toHaveBeenCalledWith("req-1");
    });
  });

  it("reloads requests after completing a standard pending request", async () => {
    (fetchRequests as jest.Mock)
      .mockResolvedValueOnce([mockRequests[0]])
      .mockResolvedValueOnce([mockRequests[0]]);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID request")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Action"));

    await waitFor(() => {
      expect(fetchRequests).toHaveBeenCalledTimes(2);
      expect(fetchCredentials).toHaveBeenCalledTimes(2);
      expect(syncRequestsFromCredentials).toHaveBeenCalledTimes(2);
    });
  });

  it("navigates to credential details for a past standard request with a credential id", async () => {
    const requestWithCredentialId = {
      ...mockRequests[1],
      credentialId: "cred-past-1",
    };

    (fetchRequests as jest.Mock).mockResolvedValue([requestWithCredentialId]);

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("Past"));

    await waitFor(() => {
      expect(screen.getByText("AML verification")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("View"));

    await waitFor(() => {
      expect(markRequestAsRead).toHaveBeenCalledWith("req-2");
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/credential/[id]",
        params: { id: "cred-past-1" },
      });
    });

    expect(completeRequest).not.toHaveBeenCalled();
  });

  it("uses View as the button label for credential expiry requests even when pending", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue([expiryPendingRequest]);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Credential expiring soon")).toBeTruthy();
    });

    expect(screen.getByText("View")).toBeTruthy();
  });

  it("handles a pending credential expiry request by marking read, completing it, and navigating to the credential", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue([expiryPendingRequest]);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Credential expiring soon")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("View"));

    await waitFor(() => {
      expect(markRequestAsRead).toHaveBeenCalledWith("req-expiry-pending");
      expect(completeRequest).toHaveBeenCalledWith("req-expiry-pending");
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/credential/[id]",
        params: { id: "cred-123" },
      });
    });
  });

  it("handles a past credential expiry request by navigating without completing it", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue([expiryPastRequest]);

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("Past"));

    await waitFor(() => {
      expect(screen.getByText("Expired credential")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("View"));

    await waitFor(() => {
      expect(markRequestAsRead).toHaveBeenCalledWith("req-expiry-past");
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/credential/[id]",
        params: { id: "cred-456" },
      });
    });

    expect(completeRequest).not.toHaveBeenCalledWith("req-expiry-past");
  });

  it("falls back to the credentials tab when a credential expiry request has no credential id", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue([expiryPendingNoCredentialId]);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Credential expiring")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("View"));

    await waitFor(() => {
      expect(markRequestAsRead).toHaveBeenCalledWith("req-expiry-no-id");
      expect(completeRequest).toHaveBeenCalledWith("req-expiry-no-id");
      expect(router.push).toHaveBeenCalledWith("/(tabs)/credentials");
    });
  });

  it("handles request loading errors by showing the empty state", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    (fetchCredentials as jest.Mock).mockRejectedValue(new Error("boom"));

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("No pending requests")).toBeTruthy();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to sync requests from credentials",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});