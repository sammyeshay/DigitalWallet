"""Tests the routes in presentation/routes/wallet.py. It tests the functions for the routes
rather than calling the routes using HTTP. This is so the code coverage will be counted"""
# pylint: disable=redefined-outer-name

import asyncio
from unittest.mock import Mock, patch
import pytest

import requests

import fastapi

from presentation.routes.wallet import (Account,
                                        login,
                                        register,
                                        logout,
                                        create_key,
                                        get_key,
                                        get_keys,
                                        delete_key,
                                        create_did,
                                        get_did,
                                        get_dids,
                                        delete_did,
                                        receive_credential,
                                        preview_credential,
                                        accept_credential,
                                        delete_credential,
                                        get_credential,
                                        get_credentials,
                                        get_credential_status,
                                        ensure_did)

pytestmark = pytest.mark.integration

MODULE = "presentation.routes.wallet"
TEST_WALLET_API_BASE_URL="http://localhost:8000"
TEST_EMAIL="anothertestemail@gmail.com"
TEST_PASSWORD="password"
TEST_KEY_TYPE="Ed25519"
TEST_DID_TYPE="jwk"
TEST_ISSUER_ENDPOINT="http://localhost:8000/api/openid4vc/jwt/issue"
TEST_CREDENTIAL_TYPE="Aml"

def make_request(cookies=None):
    """Create a mock FastAPI Request with a real dict for cookies.

    Using a real dict ensures .get() returns None for missing keys
    rather than a Mock object.
    """
    request = Mock(spec=fastapi.Request)
    request.cookies = cookies if cookies is not None else {"login": "mock-login-cookie"}
    return request

@pytest.fixture
def mock_wallet():
    """Replaces real wallet with mocked wallet for testing"""
    with patch(f"{MODULE}.wallet") as mocked:
        yield mocked

@pytest.fixture
def logged_in_session():
    """Creates a logged in session for use in other tests"""
    asyncio.run(register(fastapi.Response(), None,
                         Account(email=TEST_EMAIL, password=TEST_PASSWORD)))
    result = asyncio.run(login(fastapi.Response(), None,
                               Account(email=TEST_EMAIL, password=TEST_PASSWORD)))

    yield requests.Request(cookies=result)

    asyncio.run(logout(fastapi.Response(), requests.Request(cookies=result)))


@pytest.mark.parametrize(
    "email,password,expected_value",
    [
        ("something@gmail.com", "password", "login"),
        ("", "password", {"error": "Failed to login to account"}),
        ("something@gmail.com", "", {"error": "Failed to login to account"})
    ]
)
def test_login(email: str, password: str, expected_value):
    """Tests the login route"""
    asyncio.run(register(fastapi.Response(), None, Account(email=email, password=password)))
    result = asyncio.run(login(fastapi.Response(), None, Account(email=email, password=password)))

    if expected_value == "login":
        assert expected_value in result
    else:
        assert result == expected_value

def test_login_fail(mock_wallet):
    """Tests login route response upon failure"""
    mock_wallet.login.return_value = None
    response = fastapi.Response()

    result = asyncio.run(
        login(response, Mock(), Account(email="", password="password"))
    )

    assert result == {"error": "Failed to login to account"}
    assert response.status_code == 400

def test_logout(logged_in_session):
    """Tests the logout route"""
    result = asyncio.run(logout(fastapi.Response(), logged_in_session))

    assert result == {}

def test_logout_failure(mock_wallet):
    """Tests the logout route response on failure"""
    mock_wallet.logout.return_value = False
    response = fastapi.Response()

    result = asyncio.run(logout(response, make_request()))

    assert result == {"error": "Failed to logout"}
    assert response.status_code == 400


@pytest.mark.parametrize(
    "email,password,expected_value,status_code",
    [
        ("something@gmail.com", "password", {}, 200),
        ("", "password", {"error": "Failed to register account"}, 400),
        ("something@gmail.com", "", {"error": "Failed to register account"}, 400)
    ]
)
def test_register(email: str, password: str, expected_value, status_code):
    """Tests the register route"""
    result = requests.post(f"{TEST_WALLET_API_BASE_URL}/api/account/register",
                         json={"email": email, "password": password}, timeout=10)

    assert result.json() == expected_value
    assert result.status_code == status_code

def test_register_failure(mock_wallet):
    """Tests the register route response on failure"""
    mock_wallet.register.return_value = False
    response = fastapi.Response()

    result = asyncio.run(
        register(response, Mock(), Account(email="", password="pass"))
    )

    assert result == {"error": "Failed to register account"}
    assert response.status_code == 400

@pytest.mark.parametrize(
    "key_type,expected_value",
    [
        ("Ed25519", "key"),
        ("secp256k1", "key"),
        ("secp256r1", "key"),
        ("RSA", "key"),
        ("Bad_type", {"error": "Failed to create key"}),
        ("", {"error": "Failed to create key"})
    ]
)
def test_create_key(logged_in_session, key_type: str, expected_value):
    """Tests the create key route for each possible key type"""
    result = asyncio.run(create_key(fastapi.Response(), logged_in_session, key_type))

    if expected_value == "key":
        assert expected_value in result
    else:
        assert result == expected_value


def test_get_key(logged_in_session):
    """Tests the get key route"""
    result = asyncio.run(create_key(fastapi.Response(), logged_in_session, TEST_KEY_TYPE))
    print(result)

    key = result["key"]

    result = asyncio.run(get_key(fastapi.Response(), logged_in_session, "bad_key"))

    assert result == {"error": "Failed to get key"}

    result = asyncio.run(get_key(fastapi.Response(), logged_in_session, key))

    assert "key" in result


def test_delete_key(logged_in_session):
    """Tests the delete key route"""
    result = asyncio.run(create_key(fastapi.Response(), logged_in_session, TEST_KEY_TYPE))

    key = result["key"]

    result = asyncio.run(delete_key(fastapi.Response(), logged_in_session, "bad_key"))

    assert result == {"error": "Failed to delete key"}

    result = asyncio.run(delete_key(fastapi.Response(), logged_in_session, key))

    assert result == {}


def test_get_keys(logged_in_session):
    """Tests the get all keys route"""
    result = asyncio.run(create_key(fastapi.Response(), logged_in_session, TEST_KEY_TYPE))
    result = asyncio.run(create_key(fastapi.Response(), logged_in_session, TEST_KEY_TYPE))

    result = asyncio.run(get_keys(fastapi.Response(), logged_in_session))

    assert len(result) >= 2


@pytest.mark.parametrize(
    "did_type,expected_value",
    [
        ("jwk", "did"),
        ("key", {"error": "Failed to create did"}),
        ("web", {"error": "Failed to create did"}),
        ("", {"error": "Failed to create did"})
    ]
)
def test_create_did(logged_in_session, did_type: str, expected_value):
    """Tests the create did route for all possible did types"""
    result = asyncio.run(create_did(fastapi.Response(), logged_in_session, did_type))

    if expected_value == "did":
        assert expected_value in result
    else:
        assert result == expected_value


def test_get_did(logged_in_session):
    """Tests the get did route"""
    result = asyncio.run(create_did(fastapi.Response(), logged_in_session, TEST_DID_TYPE))

    did = result["did"]

    result = asyncio.run(get_did(fastapi.Response(), logged_in_session, "bad_did"))

    assert result == {"error": "Failed to get did"}

    result = asyncio.run(get_did(fastapi.Response(), logged_in_session, did))

    assert "id" in result


def test_get_dids(logged_in_session):
    """Tests the route for getting alll dids"""
    result = asyncio.run(create_did(fastapi.Response(), logged_in_session, TEST_DID_TYPE))
    result = asyncio.run(create_did(fastapi.Response(), logged_in_session, TEST_DID_TYPE))

    result = asyncio.run(get_dids(fastapi.Response(), logged_in_session))

    assert len(result) >= 2


def test_delete_did(logged_in_session):
    """Tests the route for deleting a did"""
    result = asyncio.run(create_did(fastapi.Response(), logged_in_session, TEST_DID_TYPE))

    did = result["did"]

    result = asyncio.run(delete_did(fastapi.Response(), logged_in_session, "bad_did"))

    assert result == {"error": "Failed to delete did"}

    result = asyncio.run(delete_did(fastapi.Response(), logged_in_session, did))

    assert result == {}


def test_receive_credential(logged_in_session):
    """Tests receving a credential"""
    offer_url = requests.post(TEST_ISSUER_ENDPOINT,
                              params={"cred_type": TEST_CREDENTIAL_TYPE}, timeout=10) \
                              .json().get("issuance_url", "")

    result = asyncio.run(create_did(fastapi.Response(), logged_in_session, TEST_DID_TYPE))

    did = result["did"]

    result = asyncio.run(receive_credential(fastapi.Response(), logged_in_session, "bad_url", did))

    assert result == {"error": "Failed to receive credentials"}

    result = asyncio.run(receive_credential(fastapi.Response(), logged_in_session, offer_url, did))

    assert len(result) >= 1

def test_preview_credential(mock_wallet):
    """Tests the preview credential route"""
    mock_wallet.preview_credential_offer.return_value = {"id": "urn:uuid:preview"}

    result = asyncio.run(
        preview_credential(
            fastapi.Response(),
            make_request(),
            offer_url="openid-credential-offer://...",
            did="did:jwk:abc",
        )
    )

    assert result == {"id": "urn:uuid:preview"}

def test_preview_credential_failure(mock_wallet):
    """Tests the preview credential route on failure"""
    mock_wallet.preview_credential_offer.return_value = None
    response = fastapi.Response()

    result = asyncio.run(
        preview_credential(
            response,
            make_request(),
            offer_url="bad-url",
            did="did:jwk:abc",
        )
    )

    assert result == {"error": "Failed to preview credential offer"}
    assert response.status_code == 400

def test_accept_credential(mock_wallet):
    """Tests the accept credential route"""
    mock_wallet.accept_credential.return_value = True

    result = asyncio.run(
        accept_credential(fastapi.Response(), make_request(), "urn:uuid:cred-1")
    )

    assert result == {}
    mock_wallet.accept_credential.assert_called_once_with("urn:uuid:cred-1")

def test_accept_credential_failure(mock_wallet):
    """Tests the accept credential route on failure"""
    mock_wallet.accept_credential.return_value = False
    response = fastapi.Response()

    result = asyncio.run(
        accept_credential(response, make_request(), "urn:uuid:bad-cred")
    )

    assert result == {"error": "Failed to action credential"}
    assert response.status_code == 400

def test_get_credential(mock_wallet):
    """Tests the get credential route"""
    mock_wallet.get_credential.return_value = {"id": "urn:uuid:cred-1"}

    result = asyncio.run(
        get_credential(fastapi.Response(), make_request(), "urn:uuid:cred-1")
    )

    assert result == {"id": "urn:uuid:cred-1"}

def test_get_credential_failure(mock_wallet):
    """Tests the get credential route on failure"""
    mock_wallet.get_credential.return_value = None
    response = fastapi.Response()

    result = asyncio.run(
        get_credential(response, make_request(), "urn:uuid:nonexistent")
    )

    assert result == {"error": "Failed to get credential"}
    assert response.status_code == 400

def test_get_credentials(mock_wallet):
    """Tests the get credentials route"""
    mock_wallet.get_credentials.return_value = [{"id": "urn:uuid:cred-1"}]

    result = asyncio.run(get_credentials(fastapi.Response(), make_request()))

    assert result == [{"id": "urn:uuid:cred-1"}]


def test_get_credentials_failure(mock_wallet):
    """Tests the gets credential route on failure"""
    mock_wallet.get_credentials.return_value = None
    response = fastapi.Response()

    result = asyncio.run(get_credentials(response, make_request()))

    assert result == {"error": "Failed to get credentials"}
    assert response.status_code == 400

def test_delete_credential(mock_wallet):
    """Tests the delete credential route"""
    mock_wallet.delete_credential.return_value = True

    result = asyncio.run(
        delete_credential(fastapi.Response(), make_request(), "urn:uuid:cred-1")
    )

    assert result == {}
    mock_wallet.delete_credential.assert_called_once_with("urn:uuid:cred-1")

def test_delete_credential_failure(mock_wallet):
    """Tests the delete credential route on failure"""
    mock_wallet.delete_credential.return_value = False
    response = fastapi.Response()

    result = asyncio.run(
        delete_credential(response, make_request(), "urn:uuid:nonexistent")
    )

    assert result == {"error": "Failed to delete credential"}
    assert response.status_code == 400

def test_get_credential_status_valid(mock_wallet):
    """Tests the get credential status route on valid"""
    mock_wallet.get_credential_status.return_value = "valid"

    result = asyncio.run(
        get_credential_status(fastapi.Response(), make_request(), "urn:uuid:cred-1")
    )

    assert result == "valid"

def test_get_credential_status_revoked(mock_wallet):
    """Tests the get credential status route on revoked"""
    mock_wallet.get_credential_status.return_value = "revoked"

    result = asyncio.run(
        get_credential_status(fastapi.Response(), make_request(), "urn:uuid:cred-1")
    )

    assert result == "revoked"

def test_get_credential_status_failure(mock_wallet):
    """Tests the get credential status route on failure"""
    mock_wallet.get_credential_status.return_value = None
    response = fastapi.Response()

    result = asyncio.run(
        get_credential_status(response, make_request(), "urn:uuid:nonexistent")
    )

    assert result == {"error": "Failed to check credential status"}
    assert response.status_code == 400

def test_ensure_did(mock_wallet):
    """Tests the ensure did route"""
    mock_wallet.ensure_did.return_value = "did:jwk:abc"

    result = asyncio.run(ensure_did(fastapi.Response(), make_request()))

    assert result == {"did": "did:jwk:abc"}


def test_ensure_did_failure(mock_wallet):
    """Tests the ensure did route on failure"""
    mock_wallet.ensure_did.return_value = None
    response = fastapi.Response()

    result = asyncio.run(ensure_did(response, make_request()))

    assert result == {"error": "Failed to ensure did"}
    assert response.status_code == 400
