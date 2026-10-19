"""
Wallet service wrapper for interacting with Walt.id wallet APIs.

Provides helper methods for:
- Authentication
- DID and key management
- Credential lifecycle
- Presentation flows
"""

import os
from datetime import datetime
import base64
import json

import requests

try:
    import dateparser
except ImportError:  # fallback if not installed
    dateparser = None

from credential.status_list import decode_decompress_list

from .waltid_wallet import WaltIdWallet

WALLET_API_BASE_URL = os.getenv("WALLET_API_BASE_URL", "http://wallet-api:7001")


class Wallet:  # pylint: disable=too-many-public-methods
    """Facade over Walt.id wallet API."""

    waltid_wallet_url = WALLET_API_BASE_URL
    waltid_wallet = None
    _instance = None

    def __init__(self, waltid_wallet = None):
        """Initialise wallet client."""
        if waltid_wallet is None:
            self.waltid_wallet = WaltIdWallet(requests.Session(), self.waltid_wallet_url)
        else:
            self.waltid_wallet = waltid_wallet

    def set_cookies(self, cookies: dict) -> None:
        """Set session cookies for API calls."""
        self.waltid_wallet.set_cookies(cookies)

    def login(self, email: str, password: str) -> dict | None:
        """Authenticate user."""
        return self.waltid_wallet.login(email, password)

    def logout(self) -> bool:
        """Logout current session."""
        return self.waltid_wallet.logout()

    def register(self, name: str, email: str, password: str) -> bool:
        """Register a new user."""
        return self.waltid_wallet.register(name, email, password)

    def create_key(self, key_type: str) -> str | None:
        """Create a cryptographic key."""
        return self.waltid_wallet.create_key(key_type)

    def get_key(self, key: str) -> dict | None:
        """Retrieve key metadata."""
        return self.waltid_wallet.get_key(key)

    def delete_key(self, key: str) -> bool:
        """Delete a key."""
        return self.waltid_wallet.delete_key(key)

    def get_keys(self) -> dict | None:
        """List all keys."""
        return self.waltid_wallet.get_keys()

    def create_did(self, did_type: str) -> str | None:
        """Create a DID of specified type."""
        if did_type == "jwk":
            return self.waltid_wallet.create_did_jwk()

        if did_type in ["key", "web"]:
            return None  # not implemented

        return None

    def get_did(self, did: str) -> dict | None:
        """Retrieve DID."""
        return self.waltid_wallet.get_did(did)

    def delete_did(self, did: str) -> bool:
        """Delete DID."""
        return self.waltid_wallet.delete_did(did)

    def get_dids(self) -> dict | None:
        """List DIDs."""
        return self.waltid_wallet.get_dids()

    def receive_credential(self, offer_url: str, did: str) -> list[str] | None:
        """Accept credential offer and return IDs."""
        credentials = self.waltid_wallet.receive_credential(offer_url, did)

        if not credentials:
            return None

        return [
            c.get("id")
            for c in credentials
            if isinstance(c.get("id"), str)
        ]

    def preview_credential_offer(self, offer_url: str, did: str) -> dict | None:
        """Preview credential offer."""
        credentials = self.waltid_wallet.receive_credential(offer_url, did)
        if not credentials:
            return None
        return credentials[0]

    def accept_credential(self, credential: str) -> bool:
        """Accept issued credential."""
        return self.waltid_wallet.accept_credential(credential)

    def get_credential(self, credential: str) -> dict | None:
        """Retrieve credential."""
        return self.waltid_wallet.get_credential(credential)

    def delete_credential(self, credential: str) -> bool:
        """Delete credential."""
        return self.waltid_wallet.delete_credential(credential)

    def get_credentials(self) -> dict | None:
        """List credentials."""
        return self.waltid_wallet.get_credentials()

    def is_revoked(self, status_obj: dict) -> bool:
        """Gets revocation status."""
        link = status_obj.get("statusListCredential")
        index = status_obj.get("statusListIndex")

        response = requests.get(link, timeout=5)
        if response.status_code != 200:
            return False

        parts = response.text.strip().split(".")
        if len(parts) != 3:
            return False

        payload_b64 = parts[1] + "=" * (-len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))

        encoded_list = (
            payload.get("vc", {})
            .get("credentialSubject", {})
            .get("encodedList")
        )

        if not encoded_list:
            return False

        bit_list = decode_decompress_list(encoded_list)
        idx = int(index)

        return 0 <= idx < len(bit_list) and bit_list[idx]

    def is_expired(self, valid_value: str) -> bool:
        """Gets expiration status."""
        if not valid_value:
            return False

        if dateparser:
            valid_until = dateparser.parse(valid_value)
        else:
            valid_until = datetime.fromisoformat(valid_value)

        return valid_until and valid_until < datetime.now(valid_until.tzinfo)

    def get_credential_status(self, credential: str) -> str:
        """
        Determine credential status: valid, expired, or revoked.
        """
        credential_doc = self.waltid_wallet.get_credential(credential)

        if credential_doc is None:
            return None

        status_obj = (
            credential_doc.get("parsedDocument", {})
            .get("credentialStatus", {})
        )

        if status_obj and self.is_revoked(status_obj):
            return "revoked"

        if self.is_expired(credential_doc.get("validUntil", "")):
            return "expired"

        return "valid"

    def resolve_presentation_request(self, presentation_request: str) -> dict | None:
        """Resolve presentation request."""
        return self.waltid_wallet.resolve_presentation_request(presentation_request)

    def match_credentials(self, presentation_definition: dict) -> list | None:
        """Match credentials against presentation definition."""
        return self.waltid_wallet.match_credentials(presentation_definition)

    def use_presentation_request(  # pylint: disable=too-many-arguments,too-many-positional-arguments
        self,
        did: str,
        presentation_request: str,
        selected_credentials: list[str],
        disclosures: dict | None = None,
        note: str | None = None,
    ) -> dict | None:
        """Submit presentation response."""
        return self.waltid_wallet.use_presentation_request(
            did=did,
            presentation_request=presentation_request,
            selected_credentials=selected_credentials,
            disclosures=disclosures,
            note=note,
        )

    def ensure_did(self, did_type: str = "jwk") -> str | None:
        """Ensure a DID exists or create one."""
        existing = self.get_dids()

        if isinstance(existing, list):
            for item in existing:
                candidate = item if isinstance(item, str) else item.get("did") or item.get("id")
                if isinstance(candidate, str) and candidate.startswith("did:"):
                    return candidate

        if isinstance(existing, dict):
            dids = existing.get("dids", [])
            for item in dids:
                candidate = item if isinstance(item, str) else item.get("did") or item.get("id")
                if isinstance(candidate, str) and candidate.startswith("did:"):
                    return candidate

        return self.create_did(did_type)


wallet = Wallet()
