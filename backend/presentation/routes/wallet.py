"""
Wallet API routes for account, keys, DIDs, and credential management.
"""
from fastapi import APIRouter, Request, Response, status
from pydantic import BaseModel, Field

from wallet import wallet


class Account(BaseModel):
    """Request model for account authentication."""
    email: str = Field(examples=["director@business.com"])
    password: str = Field(examples=["password1234"])


router = APIRouter()


@router.post("/account/login", tags=["account"])
async def login(response: Response, _request: Request, account: Account):
    """
    Logs into the backend using an email and password. This will set a cookie to be
    used for any other wallet related routes
    """
    result = wallet.login(account.email, account.password)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to login to account"}

    # App must set this cookie for any further requests
    for key, value in result.items():
        response.set_cookie(key, value)
    return result


@router.post("/account/logout", tags=["account"])
async def logout(response: Response, request: Request):
    """
    Logs out of the session associated with the cookie in the request
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.logout()

    if result is False:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to logout"}

    response.delete_cookie("login")
    return {}


@router.post("/account/register", tags=["account"])
async def register(response: Response, _request: Request, account: Account):
    """
    Registers an account with the provided email and password
    """
    result = wallet.register(account.email, account.email, account.password)

    if result is False:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to register account"}

    return {}


@router.post("/keys/create", tags=["keys"])
async def create_key(response: Response, request: Request, key_type: str):
    """
    Creates a key of a specific type

    key_type should be one of the following (case sensitive): Ed25519, secp256k1, secp256r1, or RSA

    Returns a key in the format "-MuKEyD1vjgJXyuAJin4GC-FLST3rM0XqWg0i6GRTX4" to be used in other
    key related routes
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.create_key(key_type)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to create key"}

    return {"key": result}


@router.get("/keys/{key}", tags=["keys"])
async def get_key(response: Response, request: Request, key: str):
    """
    Gets an object with details about the key including private and public key

    key should be in the format "-MuKEyD1vjgJXyuAJin4GC-FLST3rM0XqWg0i6GRTX4"

    Returns an object containing information about the key
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.get_key(key)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to get key"}

    return {"key": result}


@router.delete("/keys/{key}", tags=["keys"])
async def delete_key(response: Response, request: Request, key: str):
    """
    Deletes a key

    key should be in the format "-MuKEyD1vjgJXyuAJin4GC-FLST3rM0XqWg0i6GRTX4"
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.delete_key(key)

    if result is False:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to delete key"}

    return {}


@router.get("/keys", tags=["keys"])
async def get_keys(response: Response, request: Request):
    """
    Gets all keys associated with the logged in user. These keys can be used in the
    /keys/{key} route to get more information about them

    Returns an array of objects with metadata about each key, not the actual private
    and public key details
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.get_keys()

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to get keys"}

    return result


@router.post("/dids/create", tags=["dids"])
async def create_did(response: Response, request: Request, key_type: str = "jwk"):
    """
    Creates a did for a given key_type. The default is jwk.

    Returns a did in the format: {"did": "did:<key_type>:aabbccddeeff11223344556677889900"}
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.create_did(key_type)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to create did"}

    return {"did": result}


@router.get("/dids/{did}", tags=["dids"])
async def get_did(response: Response, request: Request, did: str):
    """
    Returns a did document object for a did if it exists.

    did should be in the format: "did:<key_type>:aabbccddeeff11223344556677889900"
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.get_did(did)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to get did"}

    return result


@router.get("/dids", tags=["dids"])
async def get_dids(response: Response, request: Request):
    """
    Returns an array of all the did documents associated with the logged in user
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.get_dids()

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to get dids"}

    return result


@router.delete("/dids/{did}", tags=["dids"])
async def delete_did(response: Response, request: Request, did: str):
    """
    Deletes a did if it exists.

    did should be in the format: "did:<key_type>:aabbccddeeff11223344556677889900"
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.delete_did(did)

    if result is False:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to delete did"}

    return {}


@router.post("/credentials/receive", tags=["credentials"])
async def receive_credential(
    response: Response, request: Request, offer_url: str, did: str
):
    """
    Receives a credential into the wallet using the given did and sets it as pending.
    It can be accepted using the accept route.

    offer_url should be in the format:[
        "openid-credential-offer://?credential_offer_uri=http..."
    ]

    did should be in the format: "did:<key_type>:aabbccddeeff11223344556677889900"

    Returns an array of credential_ids in the format
    ["urn:uuid:a60fbe67-ab0e-41fe-a18c-a52a4b739c3c",
    "urn:uuid:a60fbe67-ab0e-41fe-a18c-a52a4b739c3d"].
    Each credential_id represents one of the credentials in the offer
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.receive_credential(offer_url, did)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to receive credentials"}

    return result


@router.post(
    "/credentials/preview",
    tags=["credentials"],
    description="Preview a credential offer before acceptance. Returns the pending credential "
    "object with parsedDocument metadata.",
)
async def preview_credential(
    response: Response, request: Request, offer_url: str, did: str
):
    """Preview a credential offer before accepting it."""
    wallet.set_cookies({"login": request.cookies.get("login")})
    result = wallet.preview_credential_offer(offer_url, did)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to preview credential offer"}

    return result


@router.post("/credentials/{credential}/accept", tags=["credentials"])
async def accept_credential(response: Response, request: Request, credential: str):
    """
    Accepts a credential that has been received, usually from a credential offer

    credential should be in the format: "urn:uuid:a60fbe67-ab0e-41fe-a18c-a52a4b739c3c"
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.accept_credential(credential)

    if result is False:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to action credential"}

    return {}


@router.get("/credentials/{credential}", tags=["credentials"])
async def get_credential(response: Response, request: Request, credential: str):
    """
    Gets a credential in the jwt_vc_json format

    credential should be in the format: "urn:uuid:a60fbe67-ab0e-41fe-a18c-a52a4b739c3c"
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.get_credential(credential)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to get credential"}

    return result


@router.get("/credentials", tags=["credentials"])
async def get_credentials(response: Response, request: Request):
    """
    Gets a list of all credentials associated with the logged in user in the jwt_vc_json format
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.get_credentials()

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to get credentials"}

    return result


@router.delete("/credentials/{credential}", tags=["credentials"])
async def delete_credential(response: Response, request: Request, credential: str):
    """
    Deletes a credential

    credential should be in the format: "urn:uuid:a60fbe67-ab0e-41fe-a18c-a52a4b739c3c"
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.delete_credential(credential)

    if result is False:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to delete credential"}

    return {}


@router.get("/credentials/{credential}/status", tags=["credentials"])
async def get_credential_status(response: Response, request: Request, credential: str):
    """
    Checks the revocation status and the expiry date of the credential

    It does this by checking the below section of the credential as well as the validUntil field:

    See: https://www.w3.org/TR/vc-bitstring-status-list/#revocable-verifiable-credential

    "credentialStatus": {
        "id": "http://localhost:8001/api/status_manager/status_list#94567",
        "type": "BitstringStatusListEntry",
        "statusPurpose": "revocation",
        "statusListIndex": "94567",
        "statusListCredential": "http://localhost:8001/api/status_manager/status_list"
    },

    If the credential does not have this section then the credential is not revoked by default

    credential should be in the format: "urn:uuid:a60fbe67-ab0e-41fe-a18c-a52a4b739c3c"

    Returns "revoked" if the credential is revoked, "expired" if it is expired, "valid" otherwise

    Revoked overrides expired, so if the credential is revoked and expired it will return revoked
    """
    wallet.set_cookies(dict(request.cookies))
    result = wallet.get_credential_status(credential)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to check credential status"}

    return result


@router.post("/dids/ensure", tags=["dids"])
async def ensure_did(response: Response, request: Request, key_type: str = "jwk"):
    """Ensure a DID exists for the user, creating one if needed."""
    wallet.set_cookies({"login": request.cookies.get("login")})
    result = wallet.ensure_did(key_type)

    if result is None:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to ensure did"}

    return {"did": result}


@router.get("/ping")
async def ping():
    """Health check endpoint."""
    return {"ok": True}
