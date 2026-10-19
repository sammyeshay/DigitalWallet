import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { router } from "expo-router";

import RequestsScreen from "../../src/app/(tabs)/requests";
import {
  fetchCredentials,
  fetchCredentialById,
} from "../../api/credentials";
import {
  fetchRequests,
  syncRequestsFromCredentials,
  completeRequest,
  markRequestAsRead,
  getRequestTimeLabel,
} from "../../api/requests";
import { fetchActivityHistory } from "../../api/activity";

const focusCallbacks: (() => void)[] = [];
let consoleErrorSpy: jest.SpyInstance;

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

jest.mock("../../api/credentials", () => ({
  fetchCredentials: jest.fn(),
  fetchCredentialById: jest.fn(),
}));

jest.mock("../../api/requests", () => ({
  fetchRequests: jest.fn(),
  syncRequestsFromCredentials: jest.fn(),
  completeRequest: jest.fn(),
  markRequestAsRead: jest.fn(),
  getRequestTimeLabel: jest.fn(),
}));

jest.mock("../../api/activity", () => ({
  fetchActivityHistory: jest.fn(),
}));

async function renderAndTriggerFocus() {
  render(<RequestsScreen />);

  await act(async () => {
    for (const callback of focusCallbacks) {
      callback();
    }
  });
}

const baseRequests = [
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
    credentialId: "cred-2",
  },
];

describe("RequestsScreen - requests tabs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    focusCallbacks.length = 0;

    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (fetchCredentials as jest.Mock).mockResolvedValue([]);
    (fetchCredentialById as jest.Mock).mockResolvedValue({
      credential_id: "cred-1",
    });
    (syncRequestsFromCredentials as jest.Mock).mockResolvedValue(undefined);
    (fetchRequests as jest.Mock).mockResolvedValue([]);
    (fetchActivityHistory as jest.Mock).mockResolvedValue([]);
    (completeRequest as jest.Mock).mockResolvedValue(undefined);
    (markRequestAsRead as jest.Mock).mockResolvedValue(undefined);
    (getRequestTimeLabel as jest.Mock).mockReturnValue("Just now");
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders the screen header", async () => {
    await renderAndTriggerFocus();

    expect(screen.getByText("Requests")).toBeTruthy();
  });

  it("shows empty pending state by default", async () => {
    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("No pending requests")).toBeTruthy();
    });
  });

  it("renders pending requests", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue(baseRequests);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID request")).toBeTruthy();
    });

    expect(screen.getByText("ABRS")).toBeTruthy();
    expect(screen.getByText("Action")).toBeTruthy();
    expect(getRequestTimeLabel).toHaveBeenCalled();
  });

  it("switches to past requests", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue(baseRequests);

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("Past"));

    await waitFor(() => {
      expect(screen.getByText("AML verification")).toBeTruthy();
    });

    expect(screen.getByText("View")).toBeTruthy();
  });

  it("shows empty past state when there are no past requests", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue([
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
    ]);

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("Past"));

    await waitFor(() => {
      expect(screen.getByText("No past requests")).toBeTruthy();
    });
  });

  it("shows a requests error banner when request loading fails", async () => {
    (fetchRequests as jest.Mock).mockRejectedValue(new Error("boom"));

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Requests could not be loaded.")).toBeTruthy();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load requests",
      expect.any(Error)
    );
  });

  it("shows a requests refresh error when credential sync fails", async () => {
    (syncRequestsFromCredentials as jest.Mock).mockRejectedValue(
      new Error("sync failed")
    );

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Requests could not be refreshed.")).toBeTruthy();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to sync requests from credentials",
      expect.any(Error)
    );
  });

  it("marks and completes a pending request when pressed", async () => {
    (fetchRequests as jest.Mock)
      .mockResolvedValueOnce(baseRequests)
      .mockResolvedValueOnce(baseRequests);

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

  it("opens a linked credential from a past request", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue(baseRequests);

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
        params: { id: "cred-2" },
      });
    });
  });

  it("opens credential detail for a pending expiry request and completes it", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue([
      {
        id: "expiry-1",
        type: "pending",
        source: "credential_expiry",
        credentialId: "cred-exp-1",
        organisation: "Wallet",
        title: "Credential expiring soon",
        subtitle: "Please review this credential.",
        icon: "time-outline",
        statusColour: "#f59e0b",
        statusLabel: "Pending",
      },
    ]);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Credential expiring soon")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("View"));

    await waitFor(() => {
      expect(markRequestAsRead).toHaveBeenCalledWith("expiry-1");
      expect(completeRequest).toHaveBeenCalledWith("expiry-1");
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/credential/[id]",
        params: { id: "cred-exp-1" },
      });
    });
  });

  it("routes to credentials tab when expiry request has no credential id", async () => {
    (fetchRequests as jest.Mock).mockResolvedValue([
      {
        id: "expiry-2",
        type: "past",
        source: "credential_expiry",
        organisation: "Wallet",
        title: "Credential expired",
        subtitle: "This credential requires attention.",
        icon: "alert-circle-outline",
        statusColour: "#ef4444",
        statusLabel: "Expired",
      },
    ]);

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("Past"));

    await waitFor(() => {
      expect(screen.getByText("Credential expired")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("View"));

    await waitFor(() => {
      expect(markRequestAsRead).toHaveBeenCalledWith("expiry-2");
      expect(router.push).toHaveBeenCalledWith("/(tabs)/credentials");
    });
  });
});