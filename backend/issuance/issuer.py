"""
Utility script for issuing demo credentials through the Walt.id issuer API.
"""
# pylint: disable=duplicate-code

import json
import sys
import os

import qrcode
import requests

# Currently this calls the local host which is running a docker container of
# waltid-identity. In future this will call a remote backend running
# waltid-identity.
ISSUER_URL = "http://localhost:7002"
HEADERS = {"accept": "application/json", "Content-Type": "application/json"}

STATUS_MANAGER_INDEX_GENERATOR_URL = "http://localhost:8001/api/status_manager/status_list/index"
STATUS_LIST_URL = "http://localhost:8001/api/status_manager/status_list/credential"


def issue_cred(cred_type: str, skip_qr: bool = False) -> None:
    """
    Issue a credential and display its credential offer QR code.

    Args:
        cred_type: Credential type key matching a JSON file in ./jsonData,
            such as aml, corporate, director, sanctions, or ubo.
    """
    try:
        with open(f"{os.path.split(os.path.abspath(__file__))[0]}/jsonData/{cred_type}.json",
                   "r", encoding="utf-8") as file:
            credential_body = json.load(file)

        if "credentialStatus" in credential_body["credentialData"]:
            credential_body["credentialData"][
                "credentialStatus"
            ] = initialise_credential_status()

        response = requests.post(
            f"{ISSUER_URL}/openid4vc/jwt/issue",
            headers=HEADERS,
            json=credential_body,
            timeout=10,
        )
        print(f"Status code: {response.status_code}")
        print(f"Credential offer URL:\n{response.text}")

        if skip_qr:
            return response.text

        # Generate a QR code from the credential offer URL.
        img = qrcode.make(response.text)

        # To save into folder uncomment line below.
        # img.save(f"./qrCodes/{cred_type}_qr.png")

        # To open QR code in preview uncomment line below.
        img.show()

        return response.text

    except (OSError, json.JSONDecodeError, requests.RequestException) as error:
        print(f"Error: {error}")

    return None


def initialise_credential_status() -> dict:
    """
    Build a credentialStatus object using a fresh status list index.

    Returns:
        A BitstringStatusListEntry object, or an empty dict if generation fails.
    """
    response = requests.get(STATUS_MANAGER_INDEX_GENERATOR_URL, timeout=10)

    credential_status_object = {}

    if response.status_code == 200:
        status_list_index = response.text

        credential_status_object["id"] = ""
        credential_status_object["type"] = "BitstringStatusListEntry"
        credential_status_object["statusPurpose"] = "revocation"
        credential_status_object["statusListIndex"] = status_list_index
        credential_status_object["statusListCredential"] = STATUS_LIST_URL
        credential_status_object["id"] = (
            credential_status_object["statusListCredential"]
            + f"#{status_list_index}"
        )
        print(f"Status Index: {status_list_index}")
    else:
        return {}

    return credential_status_object


# Possible argv[1]: aml, corporate, director, sanctions, ubo
# issue_cred(sys.argv[1])

if __name__ == "__main__":
    issue_cred(sys.argv[1])
