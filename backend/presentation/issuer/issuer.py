"""
Issuance routes for creating issuance offers and revoking a credential.
"""

import json
import os
import re
from pathlib import Path
from typing import Optional
from urllib.parse import quote

import requests
from fastapi import APIRouter, HTTPException

from presentation.shared.service_result import raise_for_service_result
from wallet.waltidissuer import WaltIdIssuer

router = APIRouter()

ISSUER_API_BASE_URL = "http://issuer-api:7002"
ISSUER_PUBLIC_URL = os.getenv("ISSUER_PUBLIC_URL", "http://localhost:7002")
ISSUER_INTERNAL_URL = os.getenv("ISSUER_INTERNAL_URL", ISSUER_API_BASE_URL)

STATUS_MANAGER_API_BASE_URL=os.getenv("STATUS_MANAGER_API_BASE_URL",
                                      "http://host.docker.internal:8001")

session = requests.Session()
issuer = WaltIdIssuer(session, ISSUER_API_BASE_URL)


def rewrite_public_issuer_url(value: str) -> str:
    """Rewrite localhost issuer URLs so they are reachable by external clients."""
    value = value.replace(
        quote("http://localhost:7002", safe=""),
        quote(ISSUER_PUBLIC_URL, safe=""),
    )
    value = value.replace("http://localhost:7002", ISSUER_PUBLIC_URL)
    return value


@router.post("/openid4vc/jwt/issue", tags=["issuer"])
async def credential_issuance(
    cred_type: str,
    status_callback_uri: Optional[str] = None,
    session_ttl: Optional[int] = None,
):
    """Create a new issuance and return a wallet-scannable URL."""
    ok, issuance_body = get_cred_body(cred_type)
    if not ok:
        raise HTTPException(
            status_code=500,
            detail=issuance_body,
        )

    status_index = (
        issuance_body.get("credentialData", {})
        .get("credentialStatus", {})
        .get("statusListIndex", None)
    )

    ok, result = issuer.cred_issuance(
        issuance_body=issuance_body,
        status_callback_uri=status_callback_uri,
        session_ttl=session_ttl,
    )
    raise_for_service_result(ok, result, "Issuer returned an invalid issuance URL")

    result = rewrite_public_issuer_url(result)
    print("REWRITTEN ISSUANCE URL:", result)

    return {"issuance_url": result, "status_list_index": status_index}


def get_cred_body(cred_type: str) -> tuple:
    """
    Load the credential body JSON for the given credential type.

    Strips the type to a shorter name to match file names in the jsonData folder.
    Returns a tuple of (success, body_or_error).
    """
    match = re.match(r"[A-Z][a-z]*", cred_type)
    if not match:
        return False, {}
    min_cred = match.group(0).lower()

    try:
        project_root = Path(__file__).resolve().parents[2]
        file_path = project_root / "issuance/jsonData" / f"{min_cred}.json"

        with open(file_path, "r", encoding="utf-8") as file:
            credential_body = json.load(file)

        if "credentialStatus" in credential_body["credentialData"]:
            credential_body["credentialData"][
                "credentialStatus"
            ] = initialise_credential_status()

        return True, credential_body

    except OSError as error:
        return False, str(error)


def initialise_credential_status() -> dict:
    """
    Build a credentialStatus object using a fresh status list index.

    Returns:
        A BitstringStatusListEntry object, or an empty dict if generation fails.
    """

    status_manager_index_generator_url = (
        f"{STATUS_MANAGER_API_BASE_URL}/api/status_manager/status_list/index"
    )
    status_list_url = f"{STATUS_MANAGER_API_BASE_URL}/api/status_manager/status_list/credential"

    response = requests.get(status_manager_index_generator_url, timeout=10)

    if response.status_code != 200:
        return {}

    status_list_index = response.text
    return {
        "id": status_list_url + f"#{status_list_index}",
        "type": "BitstringStatusListEntry",
        "statusPurpose": "revocation",
        "statusListIndex": status_list_index,
        "statusListCredential": status_list_url,
    }
