export type FrontendCredential = {
  credential_id: string;
  id?: string;
  title: string;
  issuer: string;
  status: string;
  offerLink: string;
  raw?: any;
  validFrom?: string;
  validUntil?: string;
  expiryDate?: string;
  expiryStatus?: "valid" | "expiring" | "expired";
  credentialSubject?: Record<string, any>;
  type?: string[];
  disclosures?: string;
};

export type PreviewCredential = FrontendCredential & {
  credentialSubject?: Record<string, any>;
  disclosures?: string;
};


export type PresentationRequest = {
  resolved_url: string;
  presentation_definition: Record<string, any>;
  presentation_definition_localhost: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.0.249:8000/api";


const DEMO_EMAIL = "director@business.com";
const DEMO_PASSWORD = "password1234";

let sessionReady = false;

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`Request timed out: ${path}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Request failed: ${path}`);
  }

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

/* -------------------------------------------------------------------------- */
/* Wallet session / DID helpers                                                */
/* -------------------------------------------------------------------------- */

export async function registerAccount(
  email: string,
  password: string
): Promise<void> {
  await apiFetch("/account/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginAccount(
  email: string,
  password: string
): Promise<void> {
  await apiFetch("/account/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function ensureDemoWalletSession(): Promise<void> {
  if (sessionReady) return;

  try {
    await registerAccount(DEMO_EMAIL, DEMO_PASSWORD);
  } catch {
    // account may already exist
  }

  await loginAccount(DEMO_EMAIL, DEMO_PASSWORD);
  sessionReady = true;
}

function normaliseDidList(raw: any): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) =>
        typeof item === "string"
          ? item
          : typeof item?.did === "string"
            ? item.did
            : typeof item?.id === "string"
              ? item.id
              : null
      )
      .filter(Boolean) as string[];
  }

  if (Array.isArray(raw?.dids)) {
    return raw.dids
      .map((item: any) =>
        typeof item === "string"
          ? item
          : typeof item?.did === "string"
            ? item.did
            : typeof item?.id === "string"
              ? item.id
              : null
      )
      .filter(Boolean);
  }

  if (typeof raw?.did === "string") {
    return [raw.did];
  }

  return [];
}

export async function getDids(): Promise<string[]> {
  const result = await apiFetch<any>("/dids");
  return normaliseDidList(result);
}

export async function createDid(keyType = "jwk"): Promise<string> {
  const result = await apiFetch<any>(
    `/dids/create?key_type=${encodeURIComponent(keyType)}`,
    { method: "POST" }
  );

  if (typeof result === "string") return result;
  if (typeof result?.did === "string") return result.did;

  throw new Error("Backend did not return a DID.");
}

export async function ensureDid(): Promise<string> {
  await ensureDemoWalletSession();

  const result = await apiFetch<{ did?: string }>("/dids/ensure?key_type=jwk", {
    method: "POST",
  });

  if (typeof result?.did === "string" && result.did.startsWith("did:")) {
    return result.did;
  }

  throw new Error("Backend did not return a DID.");
}

/* -------------------------------------------------------------------------- */
/* Receive / accept credential offers                                          */
/* -------------------------------------------------------------------------- */

function extractReceivedCredentialIds(raw: any): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) =>
        typeof item === "string"
          ? item
          : typeof item?.id === "string"
            ? item.id
            : typeof item?.credential_id === "string"
              ? item.credential_id
              : null
      )
      .filter(Boolean) as string[];
  }

  if (typeof raw === "string") {
    return [raw];
  }

  if (typeof raw?.id === "string") {
    return [raw.id];
  }

  if (typeof raw?.credential_id === "string") {
    return [raw.credential_id];
  }

  return [];
}

export async function receiveCredentialOffer(
  offerUrl: string,
  did: string
): Promise<string[]> {
  const result = await apiFetch<any>(
    `/credentials/receive?offer_url=${encodeURIComponent(
      offerUrl
    )}&did=${encodeURIComponent(did)}`,
    { method: "POST" }
  );

  const credentialIds = extractReceivedCredentialIds(result);

  if (!credentialIds.length) {
    throw new Error("Failed to receive credential offer");
  }

  return credentialIds;
}

export async function acceptCredential(credentialId: string): Promise<void> {
  await ensureDemoWalletSession();
  await apiFetch(`/credentials/${encodeURIComponent(credentialId)}/accept`, {
    method: "POST",
  });
}

export async function receiveAndAcceptCredentialOffer(
  offerUrl: string
): Promise<string> {
  await ensureDemoWalletSession();

  const did = await ensureDid();
  const credentialIds = await receiveCredentialOffer(offerUrl, did);

  if (!credentialIds.length) {
    throw new Error("No credential IDs were returned from the offer.");
  }

  const credentialId = credentialIds[0];
  await acceptCredential(credentialId);

  return credentialId;
}

/* -------------------------------------------------------------------------- */
/* Wallet credential fetchers                                                  */
/* -------------------------------------------------------------------------- */

export async function getWalletCredentials(): Promise<any> {
  await ensureDemoWalletSession();
  return apiFetch("/credentials");
}

export async function getWalletCredential(credentialId: string): Promise<any> {
  await ensureDemoWalletSession();
  return apiFetch(`/credentials/${encodeURIComponent(credentialId)}`);
}

/* -------------------------------------------------------------------------- */
/* Normalisers                                                                 */
/* -------------------------------------------------------------------------- */

function extractTitle(raw: any): string {
  return (
    raw?.parsedDocument?.name ||
    raw?.title ||
    raw?.name ||
    raw?.credentialData?.name ||
    raw?.document?.name ||
    raw?.credentialSubject?.name ||
    (Array.isArray(raw?.parsedDocument?.type)
      ? raw.parsedDocument.type.find(
          (t: string) => t !== "VerifiableCredential"
        )
      : Array.isArray(raw?.type)
        ? raw.type.find((t: string) => t !== "VerifiableCredential")
        : typeof raw?.type === "string"
          ? raw.type
          : null) ||
    "Credential"
  );
}

function extractIssuer(raw: any): string {
  return (
    raw?.parsedDocument?.issuer?.name ||
    (typeof raw?.issuer === "string" ? raw.issuer : null) ||
    raw?.issuer?.name ||
    raw?.document?.issuer?.name ||
    raw?.vc?.issuer ||
    raw?.credentialData?.issuer?.name ||
    "Unknown issuer"
  );
}

function extractOfferLink(raw: any): string {
  return raw?.offerLink || raw?.offer_url || "";
}

function extractCredentialId(raw: any): string {
  return (
    raw?.credential_id ||
    raw?.id ||
    raw?.parsedDocument?.id ||
    raw?.document?.id ||
    raw?.urn ||
    `credential-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
}

function extractStatus(raw: any): string {
  return raw?.pending === false ? "valid" : "pending";
}

function getExpiryStatus(
  expiryDate?: string
): "valid" | "expiring" | "expired" {
  if (!expiryDate) return "valid";

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return "valid";

  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= 7) return "expiring";
  return "valid";
}

export function normaliseWalletCredential(raw: any): FrontendCredential {
  const credentialId = extractCredentialId(raw);

  const expiryDate =
    raw?.parsedDocument?.validUntil ||
    raw?.validUntil ||
    raw?.parsedDocument?.valid ||
    raw?.expirationDate;

  const expiryStatus = getExpiryStatus(expiryDate);

  return {
    credential_id: credentialId,
    id: credentialId,
    title: extractTitle(raw),
    issuer: extractIssuer(raw),
    status: extractStatus(raw),
    offerLink: extractOfferLink(raw),
    validFrom:
      raw?.parsedDocument?.validFrom || raw?.validFrom || raw?.issuanceDate,
    validUntil: expiryDate,
    expiryDate,
    expiryStatus,
    type: Array.isArray(raw?.parsedDocument?.type)
      ? raw.parsedDocument.type
      : Array.isArray(raw?.type)
        ? raw.type
        : typeof raw?.type === "string"
          ? [raw.type]
          : [],
    credentialSubject:
      raw?.parsedDocument?.credentialSubject ??
      raw?.credentialSubject ??
      undefined,
    raw,
    disclosures: raw?.disclosures ?? undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Preview / fetch helpers                                                     */
/* -------------------------------------------------------------------------- */

export async function previewCredentialOffer(
  offerUrl: string
): Promise<PreviewCredential> {
  await ensureDemoWalletSession();
  const did = await ensureDid();

  const result = await apiFetch<any>(
    `/credentials/preview?offer_url=${encodeURIComponent(
      offerUrl
    )}&did=${encodeURIComponent(did)}`,
    { method: "POST" }
  );

  return {
    ...normaliseWalletCredential(result),
    credentialSubject:
      result?.parsedDocument?.credentialSubject ??
      result?.credentialSubject ??
      undefined,
    disclosures: result?.disclosures,
  };
}

export async function fetchPresentationRequest(
  presentationRequestUrl: string
): Promise<PresentationRequest> {
  await ensureDemoWalletSession();
  const result = await apiFetch<any>(
    "/exchange/resolve-presentation-request", {
      method: "POST",
      body: JSON.stringify({
        "presentation_request": presentationRequestUrl
      }),
    },
  );

  return result;
}


export async function fetchMatchingCredentials(
  presentationDefinition: Record<string, any>
): Promise<any[]> {
  await ensureDemoWalletSession();
  const result = await apiFetch<any>(
    "/exchange/match-credentials",
    {
      method: "POST",
      body: JSON.stringify(presentationDefinition),
    }
  );

  return Array.isArray(result) ? result : [];
}

export async function fetchCredentials(): Promise<FrontendCredential[]> {
  const result = await getWalletCredentials();

  const list = Array.isArray(result)
    ? result
    : Array.isArray(result?.credentials)
      ? result.credentials
      : [];

  const normalised: FrontendCredential[] = list.map(normaliseWalletCredential);
  const withStatus: FrontendCredential[] = await Promise.all(
    normalised.map(async (cred: FrontendCredential) => {
      try {
        let status = await getStatus(cred.credential_id);
        if (status === "valid") {
          status = getExpiryStatus(cred.expiryDate || cred.validUntil);
        }
        return { ...cred, status: status || "offline" };
      } catch {
        return { ...cred, status: "offline" };
      }
    })
  );

  return withStatus.map((cred) => ({
    ...cred,
    expiryStatus: getExpiryStatus(cred.expiryDate || cred.validUntil),
  }));
}

export async function fetchCredentialById(
  credentialId: string
): Promise<FrontendCredential> {
  const walletCredential = await getWalletCredential(credentialId);
  const normalised = normaliseWalletCredential(walletCredential);

  try {
    let status = await getStatus(normalised.credential_id);
    if (status === "valid") {
      status = getExpiryStatus(normalised.expiryDate || normalised.validUntil);
    }
    return {
      ...normalised,
      status: status || "offline",
      expiryStatus: getExpiryStatus(normalised.expiryDate || normalised.validUntil),
    };
  } catch {
    return {
      ...normalised,
      status: "offline",
      expiryStatus: getExpiryStatus(normalised.expiryDate || normalised.validUntil),
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Duplicate detection                                                         */
/* -------------------------------------------------------------------------- */

function normaliseForCompare(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

export function isDuplicateCredential(
  existingCredentials: FrontendCredential[],
  incoming: {
    credentialId?: string;
    title?: string;
    issuer?: string;
    offerLink?: string;
  }
): boolean {
  const incomingCredentialId = normaliseForCompare(incoming.credentialId);
  const incomingOfferLink = normaliseForCompare(incoming.offerLink);
  const incomingTitle = normaliseForCompare(incoming.title);
  const incomingIssuer = normaliseForCompare(incoming.issuer);

  return existingCredentials.some((credential) => {
    const storedCredentialId = normaliseForCompare(
      credential.credential_id || credential.id
    );
    const storedOfferLink = normaliseForCompare(credential.offerLink);
    const storedTitle = normaliseForCompare(credential.title);
    const storedIssuer = normaliseForCompare(credential.issuer);

    if (
      incomingCredentialId &&
      storedCredentialId &&
      incomingCredentialId === storedCredentialId &&
      credential.raw?.pending !== true
    ) {
      return true;
    }

    if (
      incomingOfferLink &&
      storedOfferLink &&
      incomingOfferLink === storedOfferLink &&
      credential.raw?.pending !== true
    ) {
      return true;
    }

    if (
      incomingTitle &&
      incomingIssuer &&
      storedTitle &&
      storedIssuer &&
      incomingTitle === storedTitle &&
      incomingIssuer === storedIssuer &&
      credential.raw?.pending !== true
    ) {
      return true;
    }

    return false;
  });
}

/* -------------------------------------------------------------------------- */
/* Status meta                                                                 */
/* -------------------------------------------------------------------------- */

export const STATUS_META: Record<
  string,
  { color: string; bg: string; dot: string }
> = {
  active: { color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
  expired: { color: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
  revoked: { color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
  pending: { color: "#6366f1", bg: "#e0e7ff", dot: "#818cf8" },
  approved: { color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
  accepted: { color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
  issued: { color: "#16a34a", bg: "#dcfce7", dot: "#22c55e" },
  offline: { color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
};

/* -------------------------------------------------------------------------- */
/* Presentation / OID4VP helpers                                               */
/* -------------------------------------------------------------------------- */

export async function initialiseWalletIdentity(): Promise<string> {
  return ensureDid();
}

export async function resolvePresentationRequest(presentationRequest: string) {
  await ensureDemoWalletSession();

  return apiFetch("/exchange/resolve-presentation-request", {
    method: "POST",
    body: JSON.stringify({
      presentation_request: presentationRequest,
    }),
  });
}

export async function matchCredentialsForPresentationDefinition(
  presentationDefinition: Record<string, any>
) {
  await ensureDemoWalletSession();

  return apiFetch("/exchange/match-credentials", {
    method: "POST",
    body: JSON.stringify(presentationDefinition),
  });
}

export async function submitPresentationRequest(params: {
  presentationRequest: string;
  selectedCredentials: string[];
  disclosures?: Record<string, string[]>;
  note?: string;
}) {
  await ensureDemoWalletSession();
  const did = await ensureDid();

  return apiFetch("/exchange/use-presentation-request", {
    method: "POST",
    body: JSON.stringify({
      did,
      presentation_request: params.presentationRequest,
      selected_credentials: params.selectedCredentials,
      disclosures: params.disclosures,
      note: params.note,
    }),
  });
}

/* -------------------------------------------------------------------------- */
/* Delete                                                                      */
/* -------------------------------------------------------------------------- */

export async function deleteCredential(credentialId: string): Promise<void> {
  await ensureDemoWalletSession();
  await apiFetch(`/credentials/${encodeURIComponent(credentialId)}`, {
    method: "DELETE",
  });
}

export async function getStatus(credential: string): Promise<string> {
  await ensureDemoWalletSession();
  return apiFetch(`/credentials/${credential}/status`);
}