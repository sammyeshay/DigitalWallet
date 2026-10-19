import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import QuickActionButton from "../../components/home/QuickActionButton";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("QuickActionButton", () => {
  it("renders the label", () => {
    render(
      <QuickActionButton
        icon="scan-outline"
        label="Add"
        onPress={jest.fn()}
      />
    );

    expect(screen.getByText("Add")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();

    render(
      <QuickActionButton
        icon="qr-code-outline"
        label="Present"
        onPress={onPress}
      />
    );

    fireEvent.press(screen.getByText("Present"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});