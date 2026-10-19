"""
Verifier and exchange routes for creating verification sessions, polling session
status, resolving presentation requests, matching credentials, and submitting
presentations through the wallet service.
"""

import os
from typing import Any, Optional
from urllib.parse import quote

import requests
from fastapi import APIRouter, Header, HTTPException, Request, Response, status
from pydantic import BaseModel

from presentation.shared.service_result import raise_for_service_result
from wallet import wallet
from wallet.waltidverifier import WaltIdVerifier

router = APIRouter()

VERIFIER_API_BASE_URL = "http://verifier-api:7003"
VERIFIER_PUBLIC_URL = os.getenv("VERIFIER_PUBLIC_URL", "http://localhost:7003")
VERIFIER_INTERNAL_URL = os.getenv("VERIFIER_INTERNAL_URL", VERIFIER_API_BASE_URL)

session = requests.Session()
verifier = WaltIdVerifier(session, VERIFIER_API_BASE_URL)

class RequestedCredential(BaseModel):
    """A credential type and format requested by the verifier."""

    type: str
    format: str
    policies: Optional[list[Any]] = None


class VerificationRequest(BaseModel):
    """Payload used to initialise a new verifier session."""

    request_credentials: list[RequestedCredential]
    vp_policies: Optional[list[Any]] = None
    vc_policies: Optional[list[Any]] = None
    policy: Optional[str] = None
    args: Optional[dict[str, Any]] = None


class PresentationRequestBody(BaseModel):
    """Payload containing an OpenID4VP presentation request."""

    presentation_request: str


class UsePresentationRequest(BaseModel):
    """Payload used when submitting a credential presentation from the wallet."""

    did: str
    presentation_request: str
    selected_credentials: list[str]
    disclosures: Optional[dict[str, list[str]]] = None
    note: Optional[str] = None


def require_login_cookie(request: Request, response: Response) -> str | None:
    """Ensure the caller is authenticated and propagate cookies to the wallet."""
    login_cookie = request.cookies.get("login")
    if not login_cookie:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return None

    wallet.set_cookies(dict(request.cookies))
    return login_cookie


def rewrite_public_verifier_url(value: str) -> str:
    """Rewrite localhost verifier URLs so they are reachable by external clients."""
    value = value.replace(
        quote("http://localhost:7003", safe=""),
        quote(VERIFIER_PUBLIC_URL, safe=""),
    )
    value = value.replace("http://localhost:7003", VERIFIER_PUBLIC_URL)
    return value


def rewrite_internal_verifier_url(value: str) -> str:
    """Rewrite public verifier URLs back to the internal verifier service URL."""
    if VERIFIER_PUBLIC_URL and VERIFIER_INTERNAL_URL:
        value = value.replace(VERIFIER_PUBLIC_URL, VERIFIER_INTERNAL_URL)
    return value


@router.post("/openid4vc/verify", tags=["verifier"])
# pylint: disable=too-many-arguments,too-many-positional-arguments
async def start_verification(
    req: VerificationRequest,
    authorize_base_url: str = Header("openid4vp://authorize"),
    response_mode: str = Header("direct_post"),
    success_redirect_uri: Optional[str] = Header(None),
    error_redirect_uri: Optional[str] = Header(None),
    status_callback_uri: Optional[str] = Header(None),
    status_callback_api_key: Optional[str] = Header(None),
    state_id: Optional[str] = Header(None),
    openid4vp_profile: Optional[str] = Header("DEFAULT"),
    session_ttl: Optional[int] = Header(None),
):
    """Create a new verification session and return a wallet-scannable URL."""
    ok, result = verifier.initialise_verification(
        presentation_definition=req.model_dump(),
        authorize_base_url=authorize_base_url,
        response_mode=response_mode,
        success_redirect_uri=success_redirect_uri,
        error_redirect_uri=error_redirect_uri,
        status_callback_uri=status_callback_uri,
        status_callback_api_key=status_callback_api_key,
        state_id=state_id,
        profile=openid4vp_profile,
        session_ttl=session_ttl,
    )

    raise_for_service_result(ok, result, "Verifier returned an invalid verification URL")

    result = rewrite_public_verifier_url(result)
    print("REWRITTEN VERIFICATION URL:", result)
    return {"verification_url": result}


@router.get("/openid4vc/session/{session_id}", tags=["verifier"])
async def get_session(session_id: str):
    """Return the current verifier session state for a given session id."""
    result = verifier.get_session(session_id)

    if result is None:
        raise HTTPException(status_code=404, detail="Session not found or invalid")

    return result

@router.get("/openid4vc/session/{session_id}/presented-credentials", tags=["verifier"])
async def get_presented_credentials(session_id: str):
    """Return the credentials presented to the verifier for a given session id."""
    result = verifier.get_presented_credentials(session_id)

    if result is None:
        raise HTTPException(status_code=404, detail="Session not found or invalid")

    return result


@router.post("/exchange/resolve-presentation-request", tags=["exchange"])
async def resolve_presentation_request(
    response: Response,
    request: Request,
    body: PresentationRequestBody,
):
    """Resolve a presentation request into a wallet-usable form."""
    if not require_login_cookie(request, response):
        return {"error": "Not authenticated"}

    rewritten_request = rewrite_internal_verifier_url(body.presentation_request)
    print("Resolving presentation request:", rewritten_request)

    result = wallet.resolve_presentation_request(rewritten_request)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to resolve presentation request"}

    return result


@router.post("/exchange/match-credentials", tags=["exchange"])
async def match_credentials(
    response: Response,
    request: Request,
    presentation_definition: dict,
):
    """Match wallet credentials against a presentation definition."""
    if not require_login_cookie(request, response):
        return {"error": "Not authenticated"}

    result = wallet.match_credentials(presentation_definition)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to match credentials"}

    return result


@router.post("/exchange/use-presentation-request", tags=["exchange"])
async def use_presentation_request(
    response: Response,
    request: Request,
    req: UsePresentationRequest,
):
    """Submit a presentation request using the selected wallet credentials."""
    if not require_login_cookie(request, response):
        return {"error": "Not authenticated"}

    rewritten_request = rewrite_internal_verifier_url(req.presentation_request)

    result = wallet.use_presentation_request(
        did=req.did,
        presentation_request=rewritten_request,
        selected_credentials=req.selected_credentials,
        disclosures=req.disclosures,
        note=req.note,
    )

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Presentation was not accepted"}

    return result
