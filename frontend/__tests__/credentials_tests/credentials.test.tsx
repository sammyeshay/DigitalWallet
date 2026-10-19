import React from "react";
import { Animated } from "react-native";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import CredentialsScreen from "../../src/app/(tabs)/credentials";
import { router } from "expo-router";
import {
  deleteCredential,
  fetchCredentials,
  fetchCredentialById,
} from "../../api/credentials";
import {
  recordCredentialExpired,
  recordCredentialRevoked,
} from "../../api/activity";
import { triggerExpiryNotifications } from "../../api/expiry-notifications";

const focusCallbacks: (() => void)[] = [];
let consoleWarnSpy: jest.SpyInstance;
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
  deleteCredential: jest.fn(),
  fetchCredentialById: jest.fn(),
}));

jest.mock("../../api/activity", () => ({
  recordCredentialExpired: jest.fn(),
  recordCredentialRevoked: jest.fn(),
}));

jest.mock("../../api/expiry-notifications", () => ({
  triggerExpiryNotifications: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

const mockCredentials = [
  {
    credential_id: "cred-1",
    id: "cred-1",
    title: "Director ID",
    issuer: "ABRS",
    status: "valid",
    offerLink: "wallet://director",
    validFrom: "2026-03-14",
    validUntil: "2027-03-14",
    type: ["VerifiableCredential", "DirectorIDCredential"],
    raw: {},
    credentialSubject: {
      name: "Max Taylor",
    },
  },
  {
    credential_id: "cred-2",
    id: "cred-2",
    title: "AML Compliance",
    issuer: "AUSTRAC",
    status: "pending",
    offerLink: "wallet://aml",
    validFrom: "2026-03-10",
    validUntil: "2027-03-10",
    type: ["VerifiableCredential", "AMLComplianceCredential"],
    raw: {},
    credentialSubject: {
      name: "Max Taylor",
    },
  },
  {
    credential_id: "cred-3",
    id: "cred-3",
    title: "Revoked Test Credential",
    issuer: "ASIC",
    status: "revoked",
    offerLink: "wallet://revoked",
    validFrom: "2026-03-01",
    validUntil: "2027-03-01",
    type: ["VerifiableCredential", "CorporateRegistrationCredential"],
    raw: {},
    credentialSubject: {
      name: "Max Taylor",
    },
  },
];

async function renderAndTriggerFocus() {
  render(<CredentialsScreen />);

  await act(async () => {
    for (const callback of focusCallbacks) {
      callback();
    }
  });
}

describe("CredentialsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    focusCallbacks.length = 0;

    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (fetchCredentialById as jest.Mock).mockImplementation(async (id: string) => {
      const match = mockCredentials.find((c) => c.credential_id === id);
      return match ?? null;
    });

    (recordCredentialExpired as jest.Mock).mockResolvedValue(undefined);
    (recordCredentialRevoked as jest.Mock).mockResolvedValue(undefined);
    (triggerExpiryNotifications as jest.Mock).mockResolvedValue(undefined);

    jest.spyOn(Animated, "timing").mockReturnValue({
      start: (cb?: (result: { finished: boolean }) => void) =>
        cb && cb({ finished: true }),
      stop: jest.fn(),
      reset: jest.fn(),
    } as any);

    jest.spyOn(Animated, "spring").mockReturnValue({
      start: (cb?: (result: { finished: boolean }) => void) =>
        cb && cb({ finished: true }),
      stop: jest.fn(),
      reset: jest.fn(),
    } as any);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("renders the loading state first", async () => {
    (fetchCredentials as jest.Mock).mockReturnValue(new Promise(() => {}));

    await renderAndTriggerFocus();

    expect(screen.getByText("Credentials")).toBeTruthy();
    expect(screen.getByText("Loading credentials")).toBeTruthy();
    expect(
      screen.getByText("Preparing your wallet credentials and current status.")
    ).toBeTruthy();
  });

  it("renders the empty wallet state", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue([]);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("No Credentials Yet")).toBeTruthy();
    });

    expect(
      screen.getByText(
        "Add your first credential to start managing and sharing your business identity securely from one place."
      )
    ).toBeTruthy();
  });

  it("renders fetched credentials", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue(mockCredentials);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    expect(screen.getByText("AML Compliance")).toBeTruthy();
    expect(screen.getByText("Revoked Test Credential")).toBeTruthy();
    expect(screen.getByText("ABRS")).toBeTruthy();
    expect(screen.getByText("AUSTRAC")).toBeTruthy();
  });

  it("opens the filter panel and filters by search", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue(mockCredentials);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText("Filter"));
    });

    fireEvent.changeText(
      screen.getByPlaceholderText("Title or issuer"),
      "AUSTRAC"
    );

    await waitFor(() => {
      expect(screen.getByText("AML Compliance")).toBeTruthy();
    });

    expect(screen.queryByText("Director ID")).toBeNull();
  });

  it("shows no matches when filters exclude all credentials", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue(mockCredentials);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText("Filter"));
    });

    fireEvent.changeText(screen.getByPlaceholderText("Title or issuer"), "xyz");

    await waitFor(() => {
      expect(screen.getByText("No matches")).toBeTruthy();
    });

    expect(
      screen.getByText("No credentials match the current filters.")
    ).toBeTruthy();
  });


  it("navigates to credential details", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue(mockCredentials);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    const detailButtons = screen.getAllByText("View Details");
    fireEvent.press(detailButtons[0]);

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/credential/[id]",
      params: {
        id: "cred-1",
      },
    });
  });

  it("removes a credential after confirmation", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue(mockCredentials);
    (deleteCredential as jest.Mock).mockResolvedValue(undefined);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    const removeButtons = screen.getAllByText("Remove");
    fireEvent.press(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Remove Credential")).toBeTruthy();
    });

    fireEvent.press(screen.getAllByText("Remove")[1]);

    await waitFor(() => {
      expect(deleteCredential).toHaveBeenCalledWith("cred-1");
    });
  });

  it("shows an error banner when fetching credentials fails", async () => {
    (fetchCredentials as jest.Mock).mockRejectedValue(
      new Error("Server unavailable")
    );

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("⚠  Server unavailable")).toBeTruthy();
    });
  });

  it("updates a credential to revoked after live status refresh and records the lifecycle event", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue([
      {
        ...mockCredentials[0],
        status: "valid",
      },
    ]);

    (fetchCredentialById as jest.Mock).mockResolvedValue({
      ...mockCredentials[0],
      status: "revoked",
    });

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
      expect(screen.getByText("revoked")).toBeTruthy();
    });

    expect(recordCredentialRevoked).toHaveBeenCalledWith({
      credential_id: "cred-1",
      title: "Director ID",
      issuer: "ABRS",
      previousStatus: "valid",
    });
  });

  it("records an expired lifecycle event when live status refresh shows the credential has expired", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue([
      {
        ...mockCredentials[0],
        status: "valid",
        validUntil: "2020-01-01",
      },
    ]);

    (fetchCredentialById as jest.Mock).mockResolvedValue({
      ...mockCredentials[0],
      status: "valid",
      validUntil: "2020-01-01",
    });

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(recordCredentialExpired).toHaveBeenCalledWith({
        credential_id: "cred-1",
        title: "Director ID",
        issuer: "ABRS",
        previousStatus: "valid",
      });
    });
  });

  it("records an expired lifecycle event from fallback data when live status refresh fails", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue([
      {
        ...mockCredentials[0],
        status: "valid",
        validUntil: "2020-01-01",
      },
    ]);

    (fetchCredentialById as jest.Mock).mockRejectedValue(new Error("offline"));

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(recordCredentialExpired).toHaveBeenCalledWith({
        credential_id: "cred-1",
        title: "Director ID",
        issuer: "ABRS",
        previousStatus: "valid",
      });
    });
  });

  it("filters out credentials that are still pending in raw data", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue([
      {
        ...mockCredentials[0],
        raw: { pending: true },
      },
      mockCredentials[1],
    ]);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("AML Compliance")).toBeTruthy();
    });

    expect(screen.queryByText("Director ID")).toBeNull();
    expect(triggerExpiryNotifications).toHaveBeenCalledWith([
      {
        ...mockCredentials[0],
        raw: { pending: true },
      },
      mockCredentials[1],
    ]);
  });

  it("filters by status and clears all filters", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue(mockCredentials);

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText("Filter"));
    });

    fireEvent.press(screen.getByText("Pending"));

    await waitFor(() => {
      expect(screen.getByText("AML Compliance")).toBeTruthy();
    });

    expect(screen.queryByText("Director ID")).toBeNull();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("Clear all filters")).toBeTruthy();

    fireEvent.press(screen.getByText("Clear all filters"));

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
      expect(screen.getByText("AML Compliance")).toBeTruthy();
    });
  });

  it("shows an error banner when removing a credential fails", async () => {
    (fetchCredentials as jest.Mock).mockResolvedValue(mockCredentials);
    (deleteCredential as jest.Mock).mockRejectedValue(
      new Error("Failed to remove credential.")
    );

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Director ID")).toBeTruthy();
    });

    const removeButtons = screen.getAllByText("Remove");
    fireEvent.press(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Remove Credential")).toBeTruthy();
    });

    fireEvent.press(screen.getAllByText("Remove")[1]);

    await waitFor(() => {
      expect(screen.getByText("⚠ Failed to remove credential.")).toBeTruthy();
    });
  });

  it("shows the expiring soon badge for credentials inside the warning window", async () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 7);

    (fetchCredentials as jest.Mock).mockResolvedValue([
      {
        ...mockCredentials[0],
        validUntil: soonDate.toISOString(),
      },
    ]);

    (fetchCredentialById as jest.Mock).mockResolvedValue({
      ...mockCredentials[0],
      validUntil: soonDate.toISOString(),
    });

    await renderAndTriggerFocus();

    await waitFor(() => {
      expect(screen.getByText("Expiring soon")).toBeTruthy();
    });
  });

});