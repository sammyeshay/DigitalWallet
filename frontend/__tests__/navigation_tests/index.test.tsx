import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import Index from "../../src/app/index";
import * as SecureStore from "expo-secure-store";

import { Redirect } from "expo-router";

jest.mock("expo-router", () => ({
  Redirect: jest.fn(() => null),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
}));

describe("Index redirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to unlock when a PIN exists", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("stored-hash");

    render(<Index />);

    await waitFor(() => {
      expect(Redirect).toHaveBeenCalledWith(
        { href: "./unlock" },
        undefined
      );
    });
  });

  it("redirects to create-pin when no PIN exists", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    render(<Index />);

    await waitFor(() => {
      expect(Redirect).toHaveBeenCalledWith(
        { href: "./create-pin" },
        undefined
      );
    });
  });
});