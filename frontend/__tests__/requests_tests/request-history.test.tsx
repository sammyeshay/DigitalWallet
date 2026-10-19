import React from "react";
import { Alert } from "react-native";
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
} from "../../api/requests";
import { fetchActivityHistory } from "../../api/activity";

const focusCallbacks: (() => void)[] = [];
let consoleErrorSpy: jest.SpyInstance;
let alertSpy: jest.SpyInstance;

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

describe("RequestsScreen - history tab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    focusCallbacks.length = 0;

    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());

    (fetchCredentials as jest.Mock).mockResolvedValue([]);
    (syncRequestsFromCredentials as jest.Mock).mockResolvedValue(undefined);
    (fetchRequests as jest.Mock).mockResolvedValue([]);
    (fetchActivityHistory as jest.Mock).mockResolvedValue([]);
    (fetchCredentialById as jest.Mock).mockResolvedValue({
      credential_id: "cred-1",
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it("shows empty history state", async () => {
    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("History"));

    await waitFor(() => {
      expect(screen.getByText("No activity history")).toBeTruthy();
    });
  });

  it("renders valid activity items in history", async () => {
    (fetchActivityHistory as jest.Mock).mockResolvedValue([
      {
        id: "activity-1",
        credentialId: "cred-1",
        credentialTitle: "Director ID",
        actionType: "credential_presented",
        timestamp: "2026-04-17T10:00:00.000Z",
        source: "verifier",
        summary: "Shared with verifier",
        metadata: { issuer: "ABRS" },
      },
    ]);

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("History"));

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
      expect(screen.getByText("Shared with verifier")).toBeTruthy();
      expect(screen.getByText("View Credential")).toBeTruthy();
    });
  });

  it("filters malformed activity entries out of history", async () => {
    (fetchActivityHistory as jest.Mock).mockResolvedValue([
      {
        id: "bad-1",
        credentialTitle: "",
        credentialId: "cred-bad",
        actionType: "credential_presented",
        timestamp: "2026-04-17T10:00:00.000Z",
      },
      {
        id: "good-1",
        credentialId: "cred-1",
        credentialTitle: "Director ID",
        actionType: "credential_presented",
        timestamp: "2026-04-17T10:00:00.000Z",
        source: "verifier",
      },
    ]);

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("History"));

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    expect(screen.queryByText("bad-1")).toBeNull();
  });

  it("shows history error state when loading fails", async () => {
    (fetchActivityHistory as jest.Mock).mockRejectedValue(new Error("history"));

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("History"));

    await waitFor(() => {
      expect(screen.getByText("History unavailable")).toBeTruthy();
      expect(
        screen.getByText("Activity history could not be loaded.")
      ).toBeTruthy();
      expect(screen.getByText("Try Again")).toBeTruthy();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load activity history",
      expect.any(Error)
    );
  });

  it("retries history loading when Try Again is pressed", async () => {
    (fetchActivityHistory as jest.Mock)
      .mockRejectedValueOnce(new Error("history"))
      .mockResolvedValueOnce([
        {
          id: "activity-1",
          credentialId: "cred-1",
          credentialTitle: "Director ID",
          actionType: "credential_presented",
          timestamp: "2026-04-17T10:00:00.000Z",
          source: "verifier",
        },
      ]);

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("History"));

    await waitFor(() => {
      expect(screen.getByText("Try Again")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Try Again"));

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load activity history",
      expect.any(Error)
    );
  });

  it("opens a credential from activity history", async () => {
    (fetchActivityHistory as jest.Mock).mockResolvedValue([
      {
        id: "activity-1",
        credentialId: "cred-1",
        credentialTitle: "Director ID",
        actionType: "credential_presented",
        timestamp: "2026-04-17T10:00:00.000Z",
        source: "verifier",
      },
    ]);

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("History"));

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("View Credential"));

    await waitFor(() => {
      expect(fetchCredentialById).toHaveBeenCalledWith("cred-1");
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/credential/[id]",
        params: { id: "cred-1" },
      });
    });
  });

  it("filters out activity entries with no credential id", async () => {
    (fetchActivityHistory as jest.Mock).mockResolvedValue([
      {
        id: "activity-2",
        credentialTitle: "Director ID",
        actionType: "credential_presented",
        timestamp: "2026-04-17T10:00:00.000Z",
        source: "verifier",
      },
    ]);

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("History"));

    await waitFor(() => {
      expect(screen.getByText("No activity history")).toBeTruthy();
    });

    expect(screen.queryByText("Director ID")).toBeNull();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("shows alert when linked credential cannot be found", async () => {
    (fetchActivityHistory as jest.Mock).mockResolvedValue([
      {
        id: "activity-3",
        credentialId: "cred-missing",
        credentialTitle: "Director ID",
        actionType: "credential_presented",
        timestamp: "2026-04-17T10:00:00.000Z",
        source: "verifier",
      },
    ]);

    (fetchCredentialById as jest.Mock).mockResolvedValue(null);

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("History"));

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("View Credential"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Credential unavailable",
        "The linked credential could not be found in the wallet."
      );
    });
  });

  it("shows alert when opening the linked credential throws an error", async () => {
    (fetchActivityHistory as jest.Mock).mockResolvedValue([
      {
        id: "activity-4",
        credentialId: "cred-err",
        credentialTitle: "Director ID",
        actionType: "credential_presented",
        timestamp: "2026-04-17T10:00:00.000Z",
        source: "verifier",
      },
    ]);

    (fetchCredentialById as jest.Mock).mockRejectedValue(new Error("boom"));

    await renderAndTriggerFocus();

    fireEvent.press(screen.getByText("History"));

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("View Credential"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Credential unavailable",
        "The linked credential is no longer available or could not be opened."
      );
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to open credential from activity",
      expect.any(Error)
    );
  });
});