"""
Routes for serving the verifier web page used to generate and monitor
credential verification QR codes.
"""

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

from presentation.shared.credential_types import CREDENTIAL_TYPES

router = APIRouter(tags=["verifier-page"])

templates = Jinja2Templates(directory="presentation/verifier/templates")


@router.get("/verifier")
async def verifier_page(request: Request):
    """
    Serve the verifier UI page.

    This page allows a user to:
    - Select a credential type
    - Generate a verification QR code
    - Poll the backend for verification session status
    """
    return templates.TemplateResponse(
        request,
        "verifier.html",
        {"credential_types": CREDENTIAL_TYPES},
    )
