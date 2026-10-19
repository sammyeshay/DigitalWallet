export type UrlValidationResult =
  | { isValid: true; value: string }
  | { isValid: false; error: string };

export function isCredentialOfferUrl(value: string): boolean {
  const t = value.trim().toLowerCase();
  if (t.startsWith("openid-credential-offer://")) return true;
  if ((t.startsWith("http://") || t.startsWith("https://")) && t.includes("credential_offer")) return true;
  return false;
}

export function isPresentationRequestUrl(value: string): boolean {
  const t = value.trim().toLowerCase();
  return t.startsWith("openid4vp://") || t.startsWith("haip://");
}

export function validateLinkInput(
  rawValue: string,
  isValidUrl: (v: string) => boolean,
  invalidError: string
): UrlValidationResult {
  const value = rawValue.trim();
  if (!value) return { isValid: false, error: "Please enter a link." };
  if (!isValidUrl(value)) return { isValid: false, error: invalidError };
  return { isValid: true, value };
}
