"""
Routes for serving the issuer web page used to generate and monitor
credential issuance QR codes.
"""

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

from presentation.shared.credential_types import CREDENTIAL_TYPES

router = APIRouter(tags=["issuer-page"])

templates = Jinja2Templates(directory="presentation/issuer/templates")


@router.get("/issuer")
async def issuer_page(request: Request):
    """
    Serve the issuer UI page.

    This page allows a user (issuer) to:
    - Select a credential type
    - Generate an issuance QR code
    - Revoke a credential they have issued (change its status)
    """
    return templates.TemplateResponse(
        request,
        "issuer.html",
        {"credential_types": CREDENTIAL_TYPES},
    )
