"""Tests the routes in presentation/verifier/verifier.py. It tests the functions for the routes
rather than calling the routes using HTTP. This is so the code coverage will be counted"""
# pylint: disable=redefined-outer-name

import asyncio
from unittest.mock import Mock, patch
import pytest

import fastapi

from presentation.verifier.verifier import (
    PresentationRequestBody,
    get_session,
    resolve_presentation_request,
    match_credentials,
)

MODULE = "presentation.verifier.verifier"

def make_request(cookies=None):
    """Create a mock FastAPI Request with a real dict for cookies.

    Using a real dict ensures .get() returns None for missing keys
    rather than a Mock object.
    """
    request = Mock(spec=fastapi.Request)
    request.cookies = cookies if cookies is not None else {"login": "mock-login-cookie"}
    return request

@pytest.fixture
def mock_verifier():
    """Replace the module-level verifier instance with a mock."""
    with patch(f"{MODULE}.verifier") as mocked:
        yield mocked

@pytest.fixture
def mock_wallet():
    """Replaces real wallet with mocked wallet for testing"""
    with patch(f"{MODULE}.wallet") as mocked:
        yield mocked



def test_get_session_success(mock_verifier):
    """Tests get_session returns session data when found."""
    mock_verifier.get_session.return_value = {"id": "abc", "status": "PENDING"}

    result = asyncio.run(get_session("abc"))

    assert result["id"] == "abc"

def test_get_session_not_found(mock_verifier):
    """Tests get_session raises 404 when session does not exist."""
    mock_verifier.get_session.return_value = None

    with pytest.raises(fastapi.HTTPException) as exc_info:
        asyncio.run(get_session("nonexistent"))

    assert exc_info.value.status_code == 404


@pytest.mark.integration
def test_resolve_presentation_request_success(mock_wallet):
    """Tests resolve_presentation_request returns result on success."""
    mock_wallet.resolve_presentation_request.return_value = {"credentials": []}

    result = asyncio.run(
        resolve_presentation_request(
            fastapi.Response(),
            make_request(),
            PresentationRequestBody(presentation_request="openid4vp://..."),
        )
    )
    assert result == {"credentials": []}

@pytest.mark.integration
def test_resolve_presentation_request_fail(mock_wallet):
    """Tests resolve_presentation_request returns error dict on failure."""
    mock_wallet.resolve_presentation_request.return_value = None
    response = fastapi.Response()

    result = asyncio.run(
        resolve_presentation_request(
            response,
            make_request(),
            PresentationRequestBody(presentation_request="openid4vp://..."),
        )
    )
    assert result == {"error": "Failed to resolve presentation request"}
    assert response.status_code == 400


@pytest.mark.integration
def test_match_credentials_success(mock_wallet):
    """Tests match_credentials returns matched credentials on success."""
    mock_wallet.match_credentials.return_value = {"credentials": []}

    result = asyncio.run(
        match_credentials(
            fastapi.Response(),
            make_request(),
            {"input_descriptors": []},
        )
    )
    assert result == {"credentials": []}

@pytest.mark.integration
def test_match_credentials_fail(mock_wallet):
    """Tests match_credentials returns error dict on failure."""
    mock_wallet.match_credentials.return_value = None
    response = fastapi.Response()

    result = asyncio.run(
        match_credentials(
            response,
            make_request(),
            {"input_descriptors": []},
        )
    )
    assert result == {"error": "Failed to match credentials"}
    assert response.status_code == 400
