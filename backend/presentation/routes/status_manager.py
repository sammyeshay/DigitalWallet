"""
Status manager routes for handling credential revocation using a BitStringStatusList.
"""

from fastapi import APIRouter, Request, Response, status

from credential.status_manager import StatusManager

router = APIRouter()

STATUS_LIST = "bit_string_status_list.json"
STATUS_LIST_CREDENTIAL_URL = "http://host.docker.internal:8001/api/status_manager/status_list/credential"

status_manager = StatusManager(STATUS_LIST)


@router.get("/status_manager/status_list/index", tags=["status_manager"])
async def generate_status_list_index(response: Response, _request: Request):
    """
    Generates a random index within the range of the BitStringStatusList.

    This index is used in the credentialStatus object when issuing credentials.
    """
    result = status_manager.generate_status_list_index()

    if result < 1:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to generate new status list index"}

    return result


@router.post("/status_manager/status_list/{index}", tags=["status_manager"])
async def set_status_list_index(
    response: Response, _request: Request, index: int, value: bool
):
    """
    Set the value of an index in the status list.

    True = revoked, False = valid.
    """
    result = status_manager.set_status_list_index(index, value)

    if result < 1:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to set status list index value"}

    return {}


@router.get("/status_manager/status_list/{index:int}", tags=["status_manager"])
async def get_status_list_index(
    response: Response, _request: Request, index: int
):
    """
    Get the revocation status of a given index.

    Returns "True" if revoked, "False" otherwise.
    """
    result = status_manager.get_status_list_index(index)

    if result < 0:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Failed to get status list index value"}

    return str(result)


@router.get("/status_manager/status_list", tags=["status_manager"])
async def get_status_list(_response: Response, _request: Request):
    """
    Return the full BitStringStatusList.

    The list is gzip compressed and base64url encoded as per W3C spec.
    """
    return status_manager.get_status_list()

@router.get("/status_manager/status_list/credential", tags=["status_manager"])
async def get_status_list_credential(_response: Response, _request: Request):
    """
    Return the BitstringStatusListCredential for use by the verifier to verify a credential
    See https://www.w3.org/TR/vc-bitstring-status-list/#bitstringstatuslistcredential
    """
    jwt_str = status_manager.get_status_list_credential_jwt(STATUS_LIST_CREDENTIAL_URL)
    return Response(content=jwt_str, media_type="application/jwt")