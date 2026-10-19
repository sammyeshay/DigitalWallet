"""
Low-level Walt.id issuer API client used to create inssuance sessions.
"""
from typing import Optional

import requests


# pylint: disable=too-few-public-methods
class WaltIdIssuer:
    """Client wrapper for Walt.id issuer operations."""

    session: requests.Session
    waltid_issuer_url: str

    def __init__(self, session: requests.Session, waltid_issuer_url: str):
        """Initialise the issuer client with a HTTP session and base URL."""
        self.session = session
        self.waltid_issuer_url = waltid_issuer_url

    def cred_issuance(
      self,
      issuance_body: dict,
      status_callback_uri: Optional[str] = None,
      session_ttl: Optional[int] = None,
    ) -> tuple[bool, str]:
        """
        Create a new issuance session and return the issuer response.
        Returns a tuple of:
        - success flag
        - response body text
        """
        headers = {
            "accept": "application/json", 
            "Content-Type": "application/json"
        }

        if status_callback_uri:
            headers["statusCallbackUri"] = status_callback_uri
        if session_ttl:
            headers["sessionTtl"] = str(session_ttl)

        print("ISSUANCE REQUEST URL:", f"{self.waltid_issuer_url}/openid4vc/jwt/issue")
        print("ISSUANCE REQUEST HEADERS:", headers)
        print("ISSUANCE REQUEST JSON:", issuance_body)

        try:
            response = self.session.post(
                f"{self.waltid_issuer_url}/openid4vc/jwt/issue",
                json=issuance_body,
                headers=headers,
                timeout=10,
            )
        except requests.RequestException as e:
            return False, str(e)

        print("ISSUANCE RESPONSE STATUS:", response.status_code)
        print("ISSUANCE RESPONSE BODY:", response.text)

        if response.ok:
            return True, response.text

        return False, response.text
