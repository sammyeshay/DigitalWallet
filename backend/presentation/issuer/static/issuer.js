const generateBtn = document.getElementById("generateBtn");
const credentialType = document.getElementById("credentialType");
const qrContainer = document.getElementById("qrcode");
const errorEl = document.getElementById("error");
const statusEl = document.getElementById("status");
const metaEl = document.getElementById("meta");

let status_index = null;
let cred_status = null;

function renderMeta(data, status_index, cred_status) {
  let statusText = "Unavailable";
  let statusClass = "";

  if (cred_status !== "Unavailable") {
    if (cred_status === "False") {
      statusText = "Unrevoked";
      statusClass = "status-unrevoked";
    } else {
      statusText = "Revoked";
      statusClass = "status-revoked";
    }
  }

  let btnLabel = "Unable to change status";
  let disabled = false;

  if (cred_status && cred_status != "Unavailable") {
    btnLabel = cred_status === "False" ? "Revoke" : "Unrevoke";
  } else {
    disabled = true;
  }

  metaEl.innerHTML = `
    <strong>Credential type:</strong> ${credentialType.value}<br/>
    <strong>Status List Index:</strong> ${status_index || "Unavailable"}<br/>
    <strong>Status:</strong> <span class="${statusClass}">${statusText}</span><br/>
    <button class="revokeBtn" id="revokeBtn" ${disabled ? "disabled" : ""}>
      ${btnLabel}
    </button>
    <strong>Issuance URL:</strong><br/>${data.issuance_url}
  `;

  metaEl.classList.remove("hidden");

  const revokeBtn = document.getElementById("revokeBtn");
  revokeBtn.onclick = async () => {
    await updateStatusResponse(status_index, cred_status === "False");
    cred_status = await getStatusResponse(status_index);
    renderMeta(data, status_index, cred_status);
  };
}

function resetUi() {
  qrContainer.innerHTML = "";
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
  statusEl.textContent = "";
  statusEl.className = "success hidden";
  metaEl.innerHTML = "";
  metaEl.classList.add("hidden");
}

async function getStatusResponse(status_index) {
  try {
    const response = await fetch(
      `http://localhost:8001/api/status_manager/status_list/${status_index}`
    );
    if (!response.ok) {
      throw new Error("Request failed");
    }
    return await response.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function updateStatusResponse(status_index, value) {
  try {
    const response = await fetch(
      `http://localhost:8001/api/status_manager/status_list/${status_index}?value=${value}`,
      { method: "POST" }
    );
    if (!response.ok) {
      throw new Error("Request failed");
    }
  } catch (e) {
    console.error(e);
  }
}

async function generateQr() {
  resetUi();

  try {
    const response = await fetch(`/api/openid4vc/jwt/issue?cred_type=${credentialType.value}`, {
      method: "POST"
    });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || "Failed to create issuance session");
    }

    const data = text ? JSON.parse(text) : {};
    console.log("issuance response: ", data);

    if (!data.issuance_url) {
      throw new Error("No issuance URL returned");
    }

    qrContainer.innerHTML = "";
    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, data.issuance_url, { width: 240 });
    qrContainer.appendChild(canvas);

    if (data.status_list_index !== null) {
      status_index = data.status_list_index;
    }

    statusEl.textContent = status_index
      ? "QR code ready for scanning"
      : "QR code ready, but status index could not be extracted";
    statusEl.className = "success";

    cred_status = status_index ? await getStatusResponse(status_index) : "Unavailable";
    renderMeta(data, status_index, cred_status);
  } catch (err) {
    errorEl.textContent = err.message || "Something went wrong";
    errorEl.classList.remove("hidden");
  }
}

generateBtn.addEventListener("click", generateQr);
