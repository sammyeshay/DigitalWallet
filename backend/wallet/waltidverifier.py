"""
Low-level Walt.id verifier API client used to create and inspect verification sessions.
"""

from typing import Optional

import requests

WALTID_VERIFIER_BASE_ENDPOINTS = {
    "features_registered": "/features/registered",
    "features_state": "/features/state",
    "verify": "/openid4vc/verify",
    "session": "/openid4vc/session",
    "presented_credentials": "/openid4vc/session/{id}/presented-credentials",
    "policy_list": "/openid4vc/policy-list",
}


class WaltIdVerifier:
    """Client wrapper for Walt.id verifier operations."""

    session: requests.Session
    waltid_verifier_url: str

    def __init__(self, session: requests.Session, waltid_verifier_url: str):
        """Initialise the verifier client with an HTTP session and base URL."""
        self.session = session
        self.waltid_verifier_url = waltid_verifier_url

    # pylint: disable=too-many-arguments,too-many-positional-arguments
    def initialise_verification(
        self,
        presentation_definition: dict,
        authorize_base_url: str = "openid4vp://authorize",
        response_mode: str = "direct_post",
        success_redirect_uri: Optional[str] = None,
        error_redirect_uri: Optional[str] = None,
        status_callback_uri: Optional[str] = None,
        status_callback_api_key: Optional[str] = None,
        state_id: Optional[str] = None,
        profile: Optional[str] = None,
        session_ttl: Optional[int] = None,
    ) -> tuple[bool, str]:
        """
        Create a new verification session and return the verifier response.

        Returns a tuple of:
        - success flag
        - response body text
        """
        headers = {
            "authorizeBaseUrl": authorize_base_url,
            "responseMode": response_mode,
        }

        if success_redirect_uri:
            headers["successRedirectUri"] = success_redirect_uri
        if error_redirect_uri:
            headers["errorRedirectUri"] = error_redirect_uri
        if status_callback_uri:
            headers["statusCallbackUri"] = status_callback_uri
        if status_callback_api_key:
            headers["statusCallbackApiKey"] = status_callback_api_key
        if state_id:
            headers["stateId"] = state_id
        if profile:
            headers["openId4VPProfile"] = profile
        if session_ttl:
            headers["sessionTtl"] = str(session_ttl)

        response = self.session.post(
            f"{self.waltid_verifier_url}/openid4vc/verify",
            json=presentation_definition,
            headers=headers,
            timeout=10,
        )

        if response.status_code == 200:
            return True, response.text

        return False, response.text

    def get_session(self, session_id: str) -> dict | None:
        """Return the verifier session payload for a given session id."""
        response = self.session.get(
            f"{self.waltid_verifier_url}/openid4vc/session/{session_id}",
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()

        return None

    def get_presented_credentials(self, session_id: str) -> dict | None:
        """Return the credentials presented during a given verification session."""
        response = self.session.get(
            f"{self.waltid_verifier_url}/openid4vc/session/{session_id}/presented-credentials",
            timeout=10,
        )

        if response.status_code == 200:
            return response.json()

        return None
