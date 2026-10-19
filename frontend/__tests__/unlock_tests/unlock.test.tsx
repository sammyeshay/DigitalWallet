import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import UnlockScreen from "../../src/app/unlock";
import { router } from "expo-router";
import { verifyPassword } from "../../api/local-auth";
import { initialiseWalletIdentity } from "../../api/credentials";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock("../../api/local-auth", () => ({
  verifyPassword: jest.fn(),
  authenticateBiometrics: jest.fn().mockResolvedValue(false),
}));

jest.mock("../../api/credentials", () => ({
  initialiseWalletIdentity: jest.fn(),
}));

describe("UnlockScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (initialiseWalletIdentity as jest.Mock).mockResolvedValue(undefined);
  });

  it("renders the unlock UI", () => {
    render(<UnlockScreen />);

    expect(screen.getByText("Enter Pin")).toBeTruthy();
    expect(screen.getByText("Unlock")).toBeTruthy();
  });

  it("shows an error if unlock is pressed with fewer than 4 digits", () => {
    render(<UnlockScreen />);

    const input = screen.getByTestId("pin-input");
    const button = screen.getByText("Unlock");

    fireEvent.changeText(input, "12");
    fireEvent.press(button);

    expect(screen.getByText("Enter a 4-digit PIN")).toBeTruthy();
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows an error for an incorrect PIN", async () => {
    (verifyPassword as jest.Mock).mockResolvedValue({ ok: false });

    render(<UnlockScreen />);

    const input = screen.getByTestId("pin-input");

    fireEvent.changeText(input, "9999");

    await waitFor(() => {
      expect(verifyPassword).toHaveBeenCalledWith("9999");
      expect(screen.getByText("Incorrect PIN")).toBeTruthy();
    });

    expect(router.replace).not.toHaveBeenCalled();
  });

  it("navigates to tabs when the correct PIN is entered", async () => {
    (verifyPassword as jest.Mock).mockResolvedValue({ ok: true });

    render(<UnlockScreen />);

    const input = screen.getByTestId("pin-input");

    fireEvent.changeText(input, "1234");

    await waitFor(() => {
      expect(verifyPassword).toHaveBeenCalledWith("1234");
      expect(initialiseWalletIdentity).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("shows an error if verification throws", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (verifyPassword as jest.Mock).mockRejectedValue(new Error("boom"));

    render(<UnlockScreen />);

    const input = screen.getByTestId("pin-input");

    fireEvent.changeText(input, "1234");

    await waitFor(() => {
      expect(screen.getByText("Unable to verify PIN")).toBeTruthy();
    });

    expect(router.replace).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});