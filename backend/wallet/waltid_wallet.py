"""
Low-level Walt.id wallet API client used by the application wallet service.
"""

import json
from urllib.parse import parse_qs, unquote, urlparse

import requests


class WaltIdWallet:  # pylint: disable=too-many-public-methods
    """Client wrapper for Walt.id wallet operations."""

    session = None
    waltid_wallet_url = None

    def __init__(self, session: requests.Session, waltid_wallet_url: str):
        """Initialise the client with an HTTP session and wallet base URL."""
        self.session = session
        self.waltid_wallet_url = waltid_wallet_url
        self._wallet_id = None

    def _wallet_path(self, suffix: str) -> str:
        """Build a wallet-scoped API path using the current wallet id."""
        wallet_id = self.get_wallet()
        return f"{self.waltid_wallet_url}/wallet-api/wallet/{wallet_id}/{suffix}"

    def set_cookies(self, cookies: dict) -> None:
        """Replace the current session cookies with the supplied cookie set."""
        self.session.cookies.clear()
        for cookie_name, cookie_value in cookies.items():
            self.session.cookies.set(cookie_name, cookie_value)

    def login(self, email: str, password: str) -> dict | None:
        """
        Log in to Walt.id wallet using email and password.

        Returns the response cookies when successful, otherwise None.
        """
        response = self.session.post(
            f"{self.waltid_wallet_url}/wallet-api/auth/login",
            json={
                "type": "email",
                "email": email,
                "password": password,
            },
            timeout=10,
        )

        if response.status_code == 200:
            return response.cookies.get_dict()

        return None

    def logout(self) -> bool:
        """Log out of the current Walt.id wallet session."""
        response = self.session.post(
            f"{self.waltid_wallet_url}/wallet-api/auth/logout",
            timeout=10,
        )

        if response.status_code == 200:
            self._wallet_id = None
            return True

        return False

    def register(self, name: str, email: str, password: str) -> bool:
        """
        Register an account in Walt.id wallet.

        Returns True if the account is created or already exists.
        """
        response = self.session.post(
            f"{self.waltid_wallet_url}/wallet-api/auth/register",
            json={
                "type": "email",
                "name": name,
                "email": email,
                "password": password,
            },
            timeout=10,
        )

        if response.status_code in (201, 409):
            return True

        return False

    def preview_offer(self, offer_url: str, did: str) -> dict | None:
        """
        Preview a credential offer by receiving it as pending and returning
        the first credential payload.
        """
        credentials = self.receive_credential(offer_url, did)

        if not credentials:
            return None

        return credentials[0]

    def get_wallet(self) -> str | None:
        """
        Get the wallet id for the logged-in account.

        Returns the cached wallet id when available.
        """
        if self._wallet_id:
            return self._wallet_id

        response = self.session.get(
            f"{self.waltid_wallet_url}/wallet-api/wallet/accounts/wallets",
            timeout=10,
        )

        if response.status_code == 200:
            wallets = response.json().get("wallets", [])
            if wallets and isinstance(wallets[0], dict):
                self._wallet_id = wallets[0].get("id")
                return self._wallet_id

        return None

    def create_key(self, key_type: str) -> str | None:
        """
        Create a cryptographic key in the wallet.

        Returns the key id when successful, otherwise None.
        """
        response = self.session.post(
            self._wallet_path("keys/generate"),
            json={
                "backend": "jwk",
                "keyType": key_type,
            },
            timeout=10,
        )

        if response.status_code == 201:
            return response.text

        return None

    def get_key(self, key: str) -> dict | None:
        """Load a key from the wallet by key id."""
        response = self.session.get(
            self._wallet_path(f"keys/{key}/load"),
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()

        return None

    def delete_key(self, key: str) -> bool:
        """Delete a key from the wallet."""
        response = self.session.delete(
            self._wallet_path(f"keys/{key}"),
            timeout=10,
        )

        if response.status_code == 202:
            return True

        return False

    def get_keys(self) -> list | None:
        """Return all keys associated with the wallet."""
        response = self.session.get(
            self._wallet_path("keys"),
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()

        return None

    def create_did_jwk(self) -> str | None:
        """Create a JWK DID for use in credential and presentation flows."""
        response = self.session.post(
            self._wallet_path("dids/create/jwk"),
            timeout=10,
        )

        if response.status_code in (200, 409):
            return response.text

        return None

    def get_did(self, did: str) -> dict | None:
        """Return the DID document for a specific DID."""
        response = self.session.get(
            self._wallet_path(f"dids/{did}"),
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()

        return None

    def delete_did(self, did: str) -> bool:
        """Delete a DID from the wallet."""
        response = self.session.delete(
            self._wallet_path(f"dids/{did}"),
            timeout=10,
        )

        if response.status_code == 202:
            return True

        return False

    def get_dids(self) -> dict | None:
        """Return all DIDs associated with the logged-in wallet."""
        response = self.session.get(
            self._wallet_path("dids"),
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()

        return None

    def receive_credential(self, offer_url: str, did: str) -> list[dict] | None:
        """
        Receive credentials from a credential offer without accepting them.

        Returns the received credential payload list when successful.
        """
        response = self.session.post(
            self._wallet_path("exchange/useOfferRequest"),
            params={
                "did": did,
                "requireUserInput": True,
            },
            data=offer_url,
            headers={"Content-Type": "text/plain"},
            timeout=10,
        )

        print("wallet receive status:", response.status_code)
        print("wallet receive body:", response.text)

        if response.status_code == 200:
            return response.json()

        return None

    def get_credential(self, credential_id: str) -> dict | None:
        """Return a credential from the wallet in JWT VC JSON form."""
        response = self.session.get(
            self._wallet_path(f"credentials/{credential_id}"),
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()

        return None

    def delete_credential(self, credential_id: str) -> bool:
        """Delete a credential permanently from the wallet."""
        response = self.session.delete(
            self._wallet_path(f"credentials/{credential_id}"),
            params={"permanent": "true"},
            timeout=10,
        )

        if response.status_code == 202:
            return True

        return False

    def get_credentials(self) -> dict | None:
        """Return all credentials stored in the wallet."""
        response = self.session.get(
            self._wallet_path("credentials"),
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()

        return None

    def accept_credential(self, credential_id: str) -> bool:
        """Accept a pending credential in the wallet."""
        response = self.session.post(
            self._wallet_path(f"credentials/{credential_id}/accept"),
            timeout=10,
        )

        print(response)

        if response.status_code == 202:
            return True

        return False

    def resolve_presentation_request(self, presentation_request: str) -> dict | None:
        """
        Resolve a raw OpenID4VP request URL and inline the presentation definition.
        """
        wallet_id = self.get_wallet()
        print(f"[DEBUG] wallet_id: {wallet_id}")
        print(f"[DEBUG] presentation_request: {presentation_request}")

        if wallet_id is None:
            print("[DEBUG] wallet_id is None, aborting")
            return None

        url = (
            f"{self.waltid_wallet_url}/wallet-api/wallet/"
            f"{wallet_id}/exchange/resolvePresentationRequest"
        )
        print(f"[DEBUG] posting to: {url}")

        response = self.session.post(
            url,
            data=presentation_request,
            headers={"Content-Type": "text/plain"},
            timeout=10,
        )

        print(f"[DEBUG] response status: {response.status_code}")
        print(f"[DEBUG] response body: {response.text}")

        if response.status_code == 200:
            resolved_url = response.text
            params = parse_qs(urlparse(resolved_url).query)
            presentation_definition = json.loads(params["presentation_definition"][0])
            presentation_definition_localhost = unquote(
                params["presentation_definition_uri"][0]
            )
            return {
                "resolved_url": resolved_url,
                "presentation_definition": presentation_definition,
                "presentation_definition_localhost": presentation_definition_localhost,
            }

        return None

    def match_credentials(self, presentation_definition: dict) -> list | None:
        """Return wallet credentials matching a presentation definition."""
        response = self.session.post(
            self._wallet_path("exchange/matchCredentialsForPresentationDefinition"),
            json=presentation_definition,
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()

        return None

    # pylint: disable=too-many-arguments,too-many-positional-arguments
    def use_presentation_request(
        self,
        did: str,
        presentation_request: str,
        selected_credentials: list[str],
        disclosures: dict | None = None,
        note: str | None = None,
    ) -> dict | None:
        """
        Fulfil a presentation request using selected credentials and optional
        disclosure controls.
        """
        payload = {
            "did": did,
            "presentationRequest": presentation_request,
            "selectedCredentials": selected_credentials,
        }

        if disclosures:
            payload["disclosures"] = disclosures
        if note:
            payload["note"] = note

        response = self.session.post(
            self._wallet_path("exchange/usePresentationRequest"),
            json=payload,
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()

        return None
