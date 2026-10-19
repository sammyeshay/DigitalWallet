import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import CreatePinScreen from "../../src/app/create-pin";
import { router } from "expo-router";
import { setPassword } from "../../api/local-auth";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock("../../api/local-auth", () => ({
  setPassword: jest.fn(),
}));

describe("CreatePinScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the create PIN UI", () => {
    render(<CreatePinScreen />);

    expect(screen.getByText("Create Pin")).toBeTruthy();
    expect(screen.getByText("Continue")).toBeTruthy();
  });

  it("shows an error if the first PIN is too short", () => {
    render(<CreatePinScreen />);

    const input = screen.getByTestId("create-pin-input");
    const button = screen.getByText("Continue");

    fireEvent.changeText(input, "12");
    fireEvent.press(button);

    expect(screen.getByText("Enter a 4-digit PIN")).toBeTruthy();
  });

  it("moves to confirm step after a valid first PIN", () => {
    render(<CreatePinScreen />);

    const input = screen.getByTestId("create-pin-input");
    const button = screen.getByText("Continue");

    fireEvent.changeText(input, "1234");
    fireEvent.press(button);

    expect(screen.getByText("Confirm Pin")).toBeTruthy();
    expect(screen.getByText("Save Pin")).toBeTruthy();
  });

  it("shows an error when PINs do not match", () => {
    render(<CreatePinScreen />);

    const input = screen.getByTestId("create-pin-input");
    fireEvent.changeText(input, "1234");
    fireEvent.press(screen.getByText("Continue"));

    const confirmInput = screen.getByTestId("create-pin-input");
    fireEvent.changeText(confirmInput, "9999");
    fireEvent.press(screen.getByText("Save Pin"));

    expect(screen.getByText("PINs do not match")).toBeTruthy();
  });

  it("saves the PIN and redirects to unlock when PINs match", async () => {
    (setPassword as jest.Mock).mockResolvedValue(undefined);

    render(<CreatePinScreen />);

    const input = screen.getByTestId("create-pin-input");
    fireEvent.changeText(input, "1234");
    fireEvent.press(screen.getByText("Continue"));

    const confirmInput = screen.getByTestId("create-pin-input");
    fireEvent.changeText(confirmInput, "1234");
    fireEvent.press(screen.getByText("Save Pin"));

    await waitFor(() => {
      expect(setPassword).toHaveBeenCalledWith("1234");
      expect(router.replace).toHaveBeenCalledWith("./unlock");
    });
  });
});