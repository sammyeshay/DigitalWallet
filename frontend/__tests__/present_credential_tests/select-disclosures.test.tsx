import React from "react";
import { Switch } from "react-native";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";
import SelectDisclosuresScreen from "../../src/app/select-disclosures";
import { router, useLocalSearchParams } from "expo-router";
import {
  getSelections,
  hasSelections,
  setSelections,
} from "../../src/stores/disclosureStore";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Ionicons: ({ name }: { name?: string }) => <Text>{name}</Text>,
  };
});

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

jest.mock("../../src/stores/disclosureStore", () => ({
  getSelections: jest.fn(),
  hasSelections: jest.fn(),
  setSelections: jest.fn(),
}));

describe("SelectDisclosuresScreen", () => {
  const validDisclosures =
    "WyJ4IiwiZm9vIiwiYmFyIl0~WyJ5IiwiZGlyZWN0b3JJZCIsIkRJUi0wMDEiXQ";

  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      credentialId: "cred-1",
      title: "Director ID",
      disclosures: validDisclosures,
    });

    (hasSelections as jest.Mock).mockReturnValue(false);
    (getSelections as jest.Mock).mockReturnValue({});
  });

  it("renders the page title, subtitle, and action buttons", () => {
    render(<SelectDisclosuresScreen />);

    expect(screen.getByText("Director ID")).toBeTruthy();
    expect(
      screen.getByText(
        "Toggle off any fields you do not want to disclose to the verifier."
      )
    ).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("renders toggle rows for selectively disclosable fields", () => {
    render(<SelectDisclosuresScreen />);

    expect(screen.getByText("Foo")).toBeTruthy();
    expect(screen.getByText("Director Id")).toBeTruthy();

    const switches = screen.UNSAFE_getAllByType(Switch);
    expect(switches).toHaveLength(2);
    expect(switches[0].props.value).toBe(true);
    expect(switches[1].props.value).toBe(true);
  });

  it("uses saved selections when they already exist", () => {
    (hasSelections as jest.Mock).mockReturnValue(true);
    (getSelections as jest.Mock).mockReturnValue({
      "cred-1": {
        foo: false,
        directorId: true,
      },
    });

    render(<SelectDisclosuresScreen />);

    const switches = screen.UNSAFE_getAllByType(Switch);
    expect(switches).toHaveLength(2);
    expect(switches[0].props.value).toBe(false);
    expect(switches[1].props.value).toBe(true);
  });

  it("updates toggle state and saves selections", () => {
    render(<SelectDisclosuresScreen />);

    const switches = screen.UNSAFE_getAllByType(Switch);
    fireEvent(switches[0], "valueChange", false);

    fireEvent.press(screen.getByText("Save"));

    expect(setSelections).toHaveBeenCalledWith("cred-1", {
      foo: false,
      directorId: true,
    });
    expect(router.back).toHaveBeenCalled();
  });

  it("cancels without saving", () => {
    render(<SelectDisclosuresScreen />);

    fireEvent.press(screen.getByText("Cancel"));

    expect(setSelections).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalled();
  });

  it("falls back to Credential when title is missing", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      credentialId: "cred-1",
      disclosures: validDisclosures,
    });

    render(<SelectDisclosuresScreen />);

    expect(screen.getByText("Credential")).toBeTruthy();
  });

  it("shows the empty state when there are no selectively disclosable fields", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      credentialId: "cred-1",
      title: "Director ID",
      disclosures: "",
    });

    render(<SelectDisclosuresScreen />);

    expect(
      screen.getByText("This credential has no selectively disclosable fields.")
    ).toBeTruthy();

    expect(screen.queryByText("Foo")).toBeNull();
    expect(screen.queryByText("Director Id")).toBeNull();
    expect(screen.UNSAFE_queryAllByType(Switch)).toHaveLength(0);
  });

  it("ignores malformed disclosure values and remains usable", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      credentialId: "cred-1",
      title: "Director ID",
      disclosures: "not-valid-base64~still-bad",
    });

    render(<SelectDisclosuresScreen />);

    expect(
      screen.getByText("This credential has no selectively disclosable fields.")
    ).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("saves an empty selection object when no fields exist", () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      credentialId: "cred-1",
      title: "Director ID",
      disclosures: "",
    });

    render(<SelectDisclosuresScreen />);

    fireEvent.press(screen.getByText("Save"));

    expect(setSelections).toHaveBeenCalledWith("cred-1", {});
    expect(router.back).toHaveBeenCalled();
  });
});