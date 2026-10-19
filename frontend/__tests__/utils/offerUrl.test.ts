import {
  isCredentialOfferUrl,
  isPresentationRequestUrl,
  validateLinkInput,
} from "../../src/utils/offerUrl";

describe("isCredentialOfferUrl", () => {
  it("returns true for openid-credential-offer:// scheme", () => {
    expect(isCredentialOfferUrl("openid-credential-offer://example")).toBe(true);
  });

  it("returns true for https URL containing credential_offer", () => {
    expect(isCredentialOfferUrl("https://example.com?credential_offer=abc")).toBe(true);
  });

  it("returns true for http URL containing credential_offer", () => {
    expect(isCredentialOfferUrl("http://example.com?credential_offer=abc")).toBe(true);
  });

  it("returns false for an unrelated URL", () => {
    expect(isCredentialOfferUrl("https://example.com")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isCredentialOfferUrl("OPENID-CREDENTIAL-OFFER://example")).toBe(true);
  });
});

describe("isPresentationRequestUrl", () => {
  it("returns true for openid4vp:// scheme", () => {
    expect(isPresentationRequestUrl("openid4vp://request")).toBe(true);
  });

  it("returns true for haip:// scheme", () => {
    expect(isPresentationRequestUrl("haip://request")).toBe(true);
  });

  it("returns false for unrelated URLs", () => {
    expect(isPresentationRequestUrl("https://example.com")).toBe(false);
  });
});

describe("validateLinkInput", () => {
  const alwaysValid = () => true;
  const alwaysInvalid = () => false;

  it("returns error when input is empty", () => {
    const result = validateLinkInput("   ", alwaysValid, "bad url");
    expect(result).toEqual({ isValid: false, error: "Please enter a link." });
  });

  it("returns error when URL is invalid", () => {
    const result = validateLinkInput("not-valid", alwaysInvalid, "bad url");
    expect(result).toEqual({ isValid: false, error: "bad url" });
  });

  it("returns the trimmed value when valid", () => {
    const result = validateLinkInput("  https://example.com  ", alwaysValid, "bad url");
    expect(result).toEqual({ isValid: true, value: "https://example.com" });
  });
});
