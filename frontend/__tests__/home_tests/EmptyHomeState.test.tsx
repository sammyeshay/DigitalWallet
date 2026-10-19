import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import EmptyHomeState from "../../components/home/EmptyHomeState";
import { router } from "expo-router";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Ionicons: ({ name }: { name?: string }) => <Text>{name}</Text>,
  };
});

describe("EmptyHomeState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the empty-state content", () => {
    render(<EmptyHomeState />);

    expect(screen.getByText("No Credentials Yet")).toBeTruthy();
    expect(
      screen.getByText(
        "Add your first credential to start managing and sharing your business identity securely from one place."
      )
    ).toBeTruthy();
    expect(screen.getByText("Add Credential")).toBeTruthy();
    expect(screen.getByText("Learn how it works")).toBeTruthy();
  });

  it("navigates to add credential when the button is pressed", () => {
    render(<EmptyHomeState />);

    fireEvent.press(screen.getByText("Add Credential"));

    expect(router.push).toHaveBeenCalledWith("/add-credential");
  });

  it("renders the help link without crashing when pressed", () => {
    render(<EmptyHomeState />);

    fireEvent.press(screen.getByText("Learn how it works"));

    expect(router.push).not.toHaveBeenCalled();
  });
});