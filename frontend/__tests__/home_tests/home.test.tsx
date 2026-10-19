import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "../../src/app/(tabs)/index";
import { fetchCredentials } from "../../api/credentials";
import { triggerExpiryNotifications } from "../../api/expiry-notifications";

let consoleWarnSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

const renderScreen = () =>
  render(
    <NavigationContainer>
      <HomeScreen />
    </NavigationContainer>
  );

jest.mock("../../api/credentials", () => ({
  fetchCredentials: jest.fn(),
}));

jest.mock("../../api/expiry-notifications", () => ({
  triggerExpiryNotifications: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (fetchCredentials as jest.Mock).mockResolvedValue([]);
    (triggerExpiryNotifications as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("renders the home header", async () => {
    renderScreen();

    expect(screen.getByText("Home")).toBeTruthy();

    await waitFor(() => {
      expect(fetchCredentials).toHaveBeenCalled();
    });

    expect(triggerExpiryNotifications).toHaveBeenCalledWith([]);
  });

  it("renders the empty state", async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("No Credentials Yet")).toBeTruthy();
    });

    expect(
      screen.getByText(
        "Add your first credential to start managing and sharing your business identity securely from one place."
      )
    ).toBeTruthy();
  });

  it("renders the empty-state action", async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Add Credential")).toBeTruthy();
    });
  });

  it("renders the help link", async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Learn how it works")).toBeTruthy();
    });
  });

  it("renders the app header", async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId("app-header")).toBeOnTheScreen();
    });
  });
});