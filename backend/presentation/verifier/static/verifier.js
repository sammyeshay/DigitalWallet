const generateBtn = document.getElementById("generateBtn");
const qrContainer = document.getElementById("qrcode");
const errorEl = document.getElementById("error");
const statusEl = document.getElementById("status");
const metaEl = document.getElementById("meta");
const showCredentialsBtn = document.getElementById("showCredentialsBtn");
const credentialModal = document.getElementById("credentialModal");
const modalCredentials = document.getElementById("modalCredentials");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const optionsOverlay = document.getElementById("optionsOverlay");

let pollInterval = null;
let currentSessionId = null;

function resetUi() {
  qrContainer.innerHTML = "";
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
  statusEl.textContent = "";
  statusEl.className = "success hidden";
  metaEl.textContent = "";
  metaEl.classList.add("hidden");
  showCredentialsBtn.classList.add("hidden");

  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  currentSessionId = null;
}

function closeCredentialModal() {
  credentialModal.classList.remove("active");
}

function openOptionsModal() {
  optionsOverlay.classList.add("active");
}

function closeOptionsModal() {
  optionsOverlay.classList.remove("active");
}

function formatFieldKey(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\bId\b/g, "ID")
    .trim();
}

function extractCredentials(data) {
  const results = [];
  const byFormat = data?.credentialsByFormat;
  if (!byFormat) return results;

  for (const entries of Object.values(byFormat)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const vcs = entry?.verifiableCredentials;
      if (!Array.isArray(vcs)) continue;
      for (const vcEntry of vcs) {
        const vc = vcEntry?.payload?.vc;
        if (vc) results.push(vc);
      }
    }
  }

  return results;
}

function buildRequestBody() {
  const vp_policies = [];
  if (document.getElementById("vp_minimum_credentials").checked) {
    vp_policies.push({
      policy: "minimum-credentials",
      args: parseInt(document.getElementById("vp_minimum_credentials_args").value) || 1
    });
  }
  if (document.getElementById("vp_maximum_credentials").checked) {
    vp_policies.push({
      policy: "maximum-credentials",
      args: parseInt(document.getElementById("vp_maximum_credentials_args").value) || 1
    });
  }
  if (document.getElementById("vp_holder_binding").checked) {
    vp_policies.push({ policy: "holder-binding" });
  }

  const vc_policies = [];
  if (document.getElementById("vc_signature").checked) vc_policies.push({ policy: "signature" });
  if (document.getElementById("vc_expired").checked) vc_policies.push({ policy: "expired" });
  if (document.getElementById("vc_not_before").checked) vc_policies.push({ policy: "not-before" });

  if (document.getElementById("vc_credential_status").checked) {
    vc_policies.push({
      policy: "credential-status",
      args: { discriminator: "w3c", value: 0, purpose: "revocation", type: "BitstringStatusList" }
    });
  }  

  const request_credentials = [];
  document.querySelectorAll("#credentialList .credential-item").forEach(item => {
    const checkbox = item.querySelector(".cred-checkbox");
    if (!checkbox.checked) return;

    const policies = [...item.querySelectorAll(".credential-policies input[type='checkbox']:checked")]
      .map(cb => ({ policy: cb.value }));

    const entry = { format: "jwt_vc_json", type: checkbox.value };
    if (policies.length) entry.policies = policies;
    request_credentials.push(entry);
  });

  return { vp_policies, vc_policies, request_credentials };
}

async function showCredentials() {
  if (!currentSessionId) return;

  try {
    const response = await fetch(`/api/openid4vc/session/${currentSessionId}/presented-credentials`);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || "Failed to fetch presented credentials");
    }

    const data = text ? JSON.parse(text) : null;
    const credentials = extractCredentials(data);
    if (credentials.length === 0) throw new Error("No credential data found in response");

    modalCredentials.innerHTML = "";

    credentials.forEach((vc, index) => {
      const item = document.createElement("div");
      item.className = "credential-item";

      const header = document.createElement("div");
      header.className = "credential-header";

      const nameSpan = document.createElement("span");
      nameSpan.className = "cred-label";
      nameSpan.textContent = vc.name ?? `Credential ${index + 1}`;

      const arrow = document.createElement("span");
      arrow.className = "expand-arrow";
      arrow.textContent = "\u25BC";

      header.appendChild(nameSpan);
      header.appendChild(arrow);

      const body = document.createElement("div");
      body.className = "credential-policies";

      if (vc.description) {
        const desc = document.createElement("p");
        desc.style.cssText = "margin: 0 0 10px; font-size: 13px; color: #aab4d4;";
        desc.textContent = vc.description;
        body.appendChild(desc);
      }

      const subject = vc.credentialSubject ?? {};
      for (const [key, value] of Object.entries(subject)) {
        if (key === "id") continue;

        const field = document.createElement("div");
        field.className = "cred-field";

        const keyEl = document.createElement("span");
        keyEl.className = "cred-field-key";
        keyEl.textContent = formatFieldKey(key);

        const valueEl = document.createElement("span");
        valueEl.className = "cred-field-value";
        valueEl.textContent = typeof value === "object" ? JSON.stringify(value) : String(value);

        field.appendChild(keyEl);
        field.appendChild(valueEl);
        body.appendChild(field);
      }

      header.addEventListener("click", () => {
        const isOpen = body.classList.toggle("open");
        arrow.style.transform = isOpen ? "rotate(180deg)" : "";
      });

      item.appendChild(header);
      item.appendChild(body);
      modalCredentials.appendChild(item);
    });

    credentialModal.classList.add("active");
  } catch (err) {
    console.error("Failed to show credentials:", err);
    errorEl.textContent = err.message || "Failed to load credential details";
    errorEl.classList.remove("hidden");
  }
}

function extractSessionIdFromVerificationUrl(verificationUrl) {
  try {
    const url = new URL(verificationUrl);

    const state = url.searchParams.get("state");
    if (state) return state;

    const responseUri = url.searchParams.get("response_uri");
    if (responseUri) {
      const responseUrl = new URL(responseUri);
      const parts = responseUrl.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || null;
    }

    const pdUri = url.searchParams.get("presentation_definition_uri");
    if (pdUri) {
      const pdUrl = new URL(pdUri);
      const parts = pdUrl.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || null;
    }

    return null;
  } catch {
    return null;
  }
}

async function pollSession(sessionId) {
  try {
    const response = await fetch(`/api/openid4vc/session/${sessionId}`);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || "Failed to fetch verifier session");
    }

    const data = text ? JSON.parse(text) : {};
    console.log("Verifier session:", data);

    if (data?.verificationResult === false) {
      statusEl.textContent = "Verification received unsuccessfully";
      statusEl.className = "unsuccessful";
      clearInterval(pollInterval);
      pollInterval = null;
      return;
    }

    if (data?.verificationResult === true) {
      statusEl.textContent = "Verification received successfully";
      statusEl.className = "verified";
      showCredentialsBtn.classList.remove("hidden");
      clearInterval(pollInterval);
      pollInterval = null;
      return;
    }

    statusEl.textContent = "Waiting for wallet response...";
    statusEl.className = "pending";
  } catch (err) {
    console.error("Session polling failed:", err);
  }
}

async function generateQr() {
  resetUi();

  const body = buildRequestBody();

  if (body.request_credentials.length === 0) {
    errorEl.textContent = "Please select at least one credential type in Options.";
    errorEl.classList.remove("hidden");
    return;
  }

  try {
    const response = await fetch("/api/openid4vc/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || "Failed to create verification session");
    }

    const data = text ? JSON.parse(text) : {};

    if (!data.verification_url) {
      throw new Error("No verification URL returned");
    }

    qrContainer.innerHTML = "";
    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, data.verification_url, { width: 240 });
    qrContainer.appendChild(canvas);

    currentSessionId = extractSessionIdFromVerificationUrl(data.verification_url);

    statusEl.textContent = currentSessionId
      ? "QR code ready for scanning"
      : "QR code ready, but session id could not be extracted";
    statusEl.className = "success";

    metaEl.innerHTML = `
      <strong>Credential types:</strong> ${body.request_credentials.map(c => c.type).join(", ")}<br/>
      <strong>Session ID:</strong> ${currentSessionId || "Unavailable"}<br/>
      <strong>Verification URL:</strong><br/>${data.verification_url}
    `;
    metaEl.classList.remove("hidden");

    if (currentSessionId) {
      pollInterval = setInterval(() => pollSession(currentSessionId), 2000);
    }
  } catch (err) {
    errorEl.textContent = err.message || "Something went wrong";
    errorEl.classList.remove("hidden");
  }
}

// Wire up credential header expand/collapse for options modal
document.querySelectorAll(".credential-header").forEach(header => {
  header.addEventListener("click", (e) => {
    if (e.target.classList.contains("cred-checkbox")) return;
    const policies = header.nextElementSibling;
    const arrow = header.querySelector(".expand-arrow");
    const isOpen = policies.classList.toggle("open");
    arrow.style.transform = isOpen ? "rotate(180deg)" : "";
  });
});

generateBtn.addEventListener("click", generateQr);
showCredentialsBtn.addEventListener("click", showCredentials);
modalCloseBtn.addEventListener("click", closeCredentialModal);
credentialModal.addEventListener("click", (e) => {
  if (e.target === credentialModal) closeCredentialModal();
});

document.getElementById("optionsBtn").addEventListener("click", openOptionsModal);
document.getElementById("optionsClose").addEventListener("click", closeOptionsModal);
document.getElementById("applyOptions").addEventListener("click", closeOptionsModal);
optionsOverlay.addEventListener("click", (e) => {
  if (e.target === optionsOverlay) closeOptionsModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeOptionsModal();
});
