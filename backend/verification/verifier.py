"""
Utility script for creating demo verification requests through the Walt.id
verifier API and displaying the resulting QR code.
"""

import sys
import uuid

import qrcode
import requests

# Currently this calls the local host which is running a docker container of
# waltid-identity. In future this will call a remote backend running
# waltid-identity.
VERIFIER_URL = "http://localhost:7003"

random_id = uuid.uuid4()
HEADERS = {
    "accept": "text/plain",
    "authorizeBaseUrl": "openid4vp://authorize",
    "responseMode": "direct_post",
    "stateId": str(random_id),
    "Content-Type": "application/json",
}

CREDENTIAL_MAP = {
    "aml": "AmlComplianceCredential",
    "corporate": "CorporateRegistrationCredential",
    "director": "DirectorIdCredential",
    "sanctions": "SanctionScreeningCredential",
    "ubo": "UboAttestationCredential",
}


types_list = [CREDENTIAL_MAP[arg] for arg in sys.argv[1:] if arg in CREDENTIAL_MAP]
TYPES = ", ".join(types_list)

PAYLOAD = {
    "request_credentials": [
        {
            "format": "jwt_vc_json",
            "type": TYPES,
        }
    ]
}

if TYPES == "":
    print(
        sys.argv[1:],
        "Does not match domain 1 credential types, choose from",
        CREDENTIAL_MAP,
    )
    sys.exit()


def request_cred() -> None:
    """Create a verification request and display its QR code."""
    response = requests.post(
        f"{VERIFIER_URL}/openid4vc/verify",
        headers=HEADERS,
        json=PAYLOAD,
        timeout=10,
    )

    img = qrcode.make(response.text)

    # To save into folder uncomment line below.
    # img.save("./qrCodes/verifier_qr.png")

    # To open qr code in preview uncomment line below.
    img.show()


request_cred()
