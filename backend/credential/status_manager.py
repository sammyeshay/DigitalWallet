"""
Manager for handling credential status lists, including index generation,
updates, and retrieval of revocation status.
"""
import requests

from .status_list import BitStringStatusList


ISSUER_DID = (
    "did:jwk:"
    "eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5Iiwia2lkIjoiRUpBYVJ0VWpZOHB2aGND"
    "NldkLXl3cWhadmdSM3o2TXFVSWNmOURyRDYwRSIsIngiOiJxbzBFclVwYUk2V2FsVVc2"
    "RzN1N2V6OTRSOXNMWmQtcjFtU3NTMHVGZVdzIn0"
)
ISSUER_API_URL = "http://issuer-api:7002"
ISSUER_JWK = {
    "kty": "OKP",
    "d": "AZNSeOgzDYq1feMCzA49vXVHh2pH0Li8KgCrYnWR4T4",
    "crv": "Ed25519",
    "kid": "EJAaRtUjY8pvhcC6Wd-ywqhZvgR3z6MqUIcf9DrD60E",
    "x": "qo0ErUpaI6WalUW6G3u7ez94R9sLZd-r1mSsS0uFeWs"
}

class StatusManager:
    """Service layer for interacting with a bitstring status list."""


    def __init__(self, status_list: str):
        """Initialise the manager with a compressed status list string."""
        self.status_list = BitStringStatusList(status_list)
        self.cached_jwt: str = None
        self.cached_encoded_list: str = None

    def generate_status_list_index(self) -> int:
        """
        Generate a new index in the status list and persist the update.

        Returns:
            The generated index.
        """
        result = self.status_list.generate_index()
        self.status_list.update_stored_list()
        return result

    def set_status_list_index(self, index: str, value: str) -> int:
        """
        Set a specific index in the status list and persist the update.

        Args:
            index: The index to update.
            value: The value to set (e.g. revoked or valid flag).

        Returns:
            Result of the update operation.
        """
        result = self.status_list.set_bit(index, value)
        self.status_list.update_stored_list()
        return result

    def get_status_list_index(self, index: int) -> bool:
        """
        Retrieve the value at a given index in the status list.

        Args:
            index: The index to check.

        Returns:
            Boolean indicating the status at that index.
        """
        return self.status_list.get_bit(index)

    def get_status_list(self) -> str:
        """
        Retrieve the full compressed and encoded status list.

        Returns:
            Encoded status list string.
        """
        return self.status_list.compress_encode_list()

    def get_status_list_credential_jwt(self, status_list_url: str) -> str:
        """Return cached signed JWT, re-signing only if the encoded list has changed."""
        current = self.get_status_list()
        if self.cached_jwt and self.cached_encoded_list == current:
            return self.cached_jwt
        self.cached_jwt = self.issue_status_list_credential_jwt(status_list_url)
        self.cached_encoded_list = current
        return self.cached_jwt

    def issue_status_list_credential_jwt(self, status_list_url: str) -> str:
        """Sign the status list credential as a JWT via Walt.id issuer raw sign endpoint."""
        sign_body = {
            "issuerKey": {"type": "jwk", "jwk": ISSUER_JWK},
            "issuerDid": ISSUER_DID,
            "subjectDid": ISSUER_DID,
            "credentialData": {
                "@context": ["https://www.w3.org/ns/credentials/v2"],
                "id": status_list_url,
                "type": ["VerifiableCredential", "BitstringStatusListCredential"],
                "issuer": ISSUER_DID,
                "credentialSubject": {
                    "id": f"{status_list_url}#list",
                    "type": "BitstringStatusList",
                    "statusPurpose": "revocation",
                    "encodedList": self.get_status_list()
                }
            },
            "mapping": {
                "jwt:iat": "<timestamp-seconds>",
                "jwt:nbf": "<timestamp-seconds>",
                "jwt:exp": "<timestamp-in-seconds:365d>",
                "jwt:jti": "<uuid>"
            }
        }

        response = requests.post(
            f"{ISSUER_API_URL}/raw/jwt/sign",
            json=sign_body,
            timeout=10,
        )
        response.raise_for_status()
        return response.text
