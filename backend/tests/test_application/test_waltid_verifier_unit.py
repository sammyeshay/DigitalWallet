"""
Optional unit tests for WaltIdIssuer and Verifier.
"""
# pylint: disable=redefined-outer-name
# pylint: disable=protected-access

import asyncio
from unittest.mock import Mock

import pytest
from requests import Request

from presentation.verifier import verifier
from presentation.verifier.verifier_page import verifier_page
from wallet.waltidverifier import WaltIdVerifier


def make_response(status_code=200, text="", json_data=None, cookies=None):
    """Create a lightweight mock response object."""
    response = Mock()
    response.status_code = status_code
    response.text = text
    response.json = Mock(return_value=json_data if json_data is not None else {})
    response.cookies = Mock()
    response.cookies.get_dict = Mock(return_value=cookies if cookies is not None else {})
    return response

pytestmark = pytest.mark.integration

TEST_WALTID_VERIFIER_URL="http://localhost:7003"

@pytest.fixture
def mock_session():
    """Provide a mocked requests-like session."""
    session = Mock()
    session.cookies = Mock()
    return session

@pytest.fixture
def verifier_client(mock_session):
    """Create a verifier client using the mock session"""
    test_verifier = WaltIdVerifier(mock_session, TEST_WALTID_VERIFIER_URL)
    return test_verifier


## waltidverifier.py file

def test_verifier_page_returns():
    """Test getting the verifier page"""
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/verifier",
        "query_string": b"",
        "headers": [],
    }
    request = Request(scope)
    response = asyncio.run(verifier_page(request))
    assert response.status_code == 200\

def test_get_initialize_verification_bare_minimum(verifier_client, mock_session):
    """"Initialise verification"""
    mock_session.post.return_value = make_response(status_code=200, text="offer_url")

    response, message = verifier_client.initialise_verification({"input_descriptors": []})

    assert response is True
    assert message == "offer_url"

    #init_ver - other cases req

def test_get_session_normal(verifier_client, mock_session):
    """Test getting the session normally"""
    expected = {"id": "test-session-id", "status": "verified"}
    mock_session.get.return_value = make_response(status_code=200, json_data=expected)

    result = verifier_client.get_session("test-session-id")

    assert result == expected
    mock_session.get.assert_called_once_with(
        f"{TEST_WALTID_VERIFIER_URL}/openid4vc/session/test-session-id",
        timeout=10,
    )

def test_get_session_bad_session(verifier_client, mock_session):
    """Test getting a session with a bad sesssion id"""
    mock_session.get.return_value = make_response(status_code=404)

    result = verifier_client.get_session("bad-session-id")

    assert result is None


def test_get_presented_credentials_return_normal(verifier_client, mock_session):
    """Test presenting credentials"""
    expected = [{"credential": "some_credential_data"}]
    mock_session.get.return_value = make_response(status_code=200, json_data=expected)

    result = verifier_client.get_presented_credentials("test-session-id")

    assert result == expected
    mock_session.get.assert_called_once_with(
        f"{TEST_WALTID_VERIFIER_URL}/openid4vc/session/test-session-id/presented-credentials",
        timeout=10,
    )


def test_get_presented_credentials_bad_session(verifier_client, mock_session):
    """Test presenting credentials with a bad session"""
    mock_session.get.return_value = make_response(status_code=404)

    result = verifier_client.get_presented_credentials("bad-session-id")

    assert result is None



### verifier.py file
def test_require_login_cookie_no_cookie():
    """Test with no cookies for using the verifier"""
    request = Mock()
    response = Mock()
    request.cookies.get.return_value = None

    result = verifier.require_login_cookie(request, response)

    assert result is None
    assert response.status_code == 401

def test_require_login_cookie_correct(monkeypatch):
    """Test with cookies for using the verifier"""
    request = Mock()
    request.cookies.get.return_value = "abc123"
    request.cookies = {"login": "abc123"}
    response = Mock()

    mock_set_cookies = Mock()
    monkeypatch.setattr("presentation.verifier.verifier.wallet.set_cookies", mock_set_cookies)

    result = verifier.require_login_cookie(request, response)

    assert result == "abc123"
    mock_set_cookies.assert_called_once_with({"login": "abc123"})


def test_rewrite_public_verifier_url_normal(monkeypatch):
    """Test rewriting the public verifier url"""
    monkeypatch.setattr("presentation.verifier.verifier.VERIFIER_PUBLIC_URL", "https://example.com")
    result = verifier.rewrite_public_verifier_url("http://localhost:7003/some/path")
    assert result == "https://example.com/some/path"


def test_rewrite_internal_verifier_url_normal(monkeypatch):
    """Test rewriting the internal verifier url"""
    monkeypatch.setattr("presentation.verifier.verifier.VERIFIER_INTERNAL_URL", "https://a.com")
    result = verifier.rewrite_internal_verifier_url("http://localhost:7003/some/path")
    assert result == "https://a.com/some/path"
