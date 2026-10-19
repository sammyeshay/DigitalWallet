import React from "react";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet, TextStyle, ViewStyle } from "react-native";
import CredentialSummaryCard from "../../components/CredentialSummaryCard";

jest.mock("../../api/credentials", () => ({
  STATUS_META: {
    valid: {
      color: "#166534",
      bg: "#DCFCE7",
      dot: "#22C55E",
    },
    pending: {
      color: "#92400E",
      bg: "#FEF3C7",
      dot: "#F59E0B",
    },
    revoked: {
      color: "#991B1B",
      bg: "#FEE2E2",
      dot: "#EF4444",
    },
  },
}));

function flattenTextStyle(style: unknown): TextStyle {
  return StyleSheet.flatten(style) as TextStyle;
}

function flattenViewStyle(style: unknown): ViewStyle {
  return StyleSheet.flatten(style) as ViewStyle;
}

describe("CredentialSummaryCard", () => {
  it("renders the core credential summary content", () => {
    render(
      <CredentialSummaryCard
        title="Director ID"
        issuer="ABRS"
        status="valid"
      />
    );

    expect(screen.getByTestId("credential-summary-card")).toBeTruthy();
    expect(screen.getByText("Director ID")).toBeTruthy();
    expect(screen.getByText("Issuer")).toBeTruthy();
    expect(screen.getByText("ABRS")).toBeTruthy();
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("valid")).toBeTruthy();
  });

  it("applies the large title style for one or two words", () => {
    render(
      <CredentialSummaryCard
        title="Director ID"
        issuer="ABRS"
        status="valid"
      />
    );

    const title = screen.getByTestId("credential-summary-title");
    const titleStyle = flattenTextStyle(title.props.style);

    expect(titleStyle.fontSize).toBe(28);
    expect(titleStyle.lineHeight).toBe(34);
  });

  it("applies the medium title style for three words", () => {
    render(
      <CredentialSummaryCard
        title="Proof Of Address"
        issuer="ABRS"
        status="valid"
      />
    );

    const title = screen.getByTestId("credential-summary-title");
    const titleStyle = flattenTextStyle(title.props.style);

    expect(titleStyle.fontSize).toBe(26);
    expect(titleStyle.lineHeight).toBe(30);
  });

  it("applies the compact title style for four or more words", () => {
    render(
      <CredentialSummaryCard
        title="Australian Business Director Credential"
        issuer="ABRS"
        status="valid"
      />
    );

    const title = screen.getByTestId("credential-summary-title");
    const titleStyle = flattenTextStyle(title.props.style);

    expect(titleStyle.fontSize).toBe(24);
    expect(titleStyle.lineHeight).toBe(28);
  });

  it("normalises status before looking up status metadata", () => {
    render(
      <CredentialSummaryCard
        title="Director ID"
        issuer="ABRS"
        status="  VALID  "
      />
    );

    const statusText = screen.getByTestId("credential-status-text");
    const statusStyle = flattenTextStyle(statusText.props.style);

    expect(statusStyle.color).toBe("#166534");
  });

  it("uses the configured badge background and dot colour for a known status", () => {
    render(
      <CredentialSummaryCard
        title="Director ID"
        issuer="ABRS"
        status="pending"
      />
    );

    const badge = screen.getByTestId("credential-status-badge");
    const dot = screen.getByTestId("credential-status-dot");

    const badgeStyle = flattenViewStyle(badge.props.style);
    const dotStyle = flattenViewStyle(dot.props.style);

    expect(badgeStyle.backgroundColor).toBe("#FEF3C7");
    expect(dotStyle.backgroundColor).toBe("#F59E0B");
  });

  it("falls back to default colours for an unknown status", () => {
    render(
      <CredentialSummaryCard
        title="Director ID"
        issuer="ABRS"
        status="expired"
      />
    );

    const statusText = screen.getByTestId("credential-status-text");
    const badge = screen.getByTestId("credential-status-badge");
    const dot = screen.getByTestId("credential-status-dot");

    const statusStyle = flattenTextStyle(statusText.props.style);
    const badgeStyle = flattenViewStyle(badge.props.style);
    const dotStyle = flattenViewStyle(dot.props.style);

    expect(statusStyle.color).toBe("#374151");
    expect(badgeStyle.backgroundColor).toBe("#F3F4F6");
    expect(dotStyle.backgroundColor).toBe("#9CA3AF");
  });

  it("falls back to default colours when status is empty", () => {
    render(
      <CredentialSummaryCard
        title="Director ID"
        issuer="ABRS"
        status=""
      />
    );

    const statusText = screen.getByTestId("credential-status-text");
    const statusStyle = flattenTextStyle(statusText.props.style);

    expect(statusStyle.color).toBe("#374151");
  });
});