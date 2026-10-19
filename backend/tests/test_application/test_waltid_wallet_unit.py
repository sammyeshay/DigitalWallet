"""
Unit tests for the WaltIdWallet client wrapper.

These tests mock the underlying HTTP session so they do not require a live
Walt.id service.
"""

# pylint: disable=redefined-outer-name
# pylint: disable=protected-access

from unittest.mock import Mock

import pytest

from wallet import WaltIdWallet

WALTID_WALLET_URL = "http://localhost:7001"


@pytest.fixture
def mock_session():
    """Provide a mocked requests-like session."""
    session = Mock()
    session.cookies = Mock()
    return session


@pytest.fixture
def wallet_client(mock_session):
    """Provide a WaltIdWallet wired to a mocked session."""
    return WaltIdWallet(mock_session, WALTID_WALLET_URL)


def make_response(status_code=200, text="", json_data=None, cookies=None):
    """Create a lightweight mock response object."""
    response = Mock()
    response.status_code = status_code
    response.text = text
    response.json = Mock(
        return_value=json_data if json_data is not None else {})
    response.cookies = Mock()
    response.cookies.get_dict = Mock(
        return_value=cookies if cookies is not None else {})
    return response


def test_register_returns_true_on_201(wallet_client, mock_session):
    """Test registering"""
    mock_session.post.return_value = make_response(status_code=201)

    result = wallet_client.register(
        "testname", "testemail@gmail.com", "password")

    assert result is True
    mock_session.post.assert_called_once_with(
        f"{WALTID_WALLET_URL}/wallet-api/auth/register",
        json={
            "type": "email",
            "name": "testname",
            "email": "testemail@gmail.com",
            "password": "password",
        },
        timeout=10,
    )


def test_register_returns_true_on_409(wallet_client, mock_session):
    """Test registering"""
    mock_session.post.return_value = make_response(status_code=409)

    assert wallet_client.register(
        "testname",
        "testemail@gmail.com",
        "password") is True


def test_register_returns_false_on_other_status(wallet_client, mock_session):
    """Test registering"""
    mock_session.post.return_value = make_response(status_code=400)

    assert wallet_client.register(
        "testname",
        "testemail@gmail.com",
        "password") is False


def test_login_returns_cookie_dict_on_200(wallet_client, mock_session):
    """Test cookies"""
    mock_session.post.return_value = make_response(
        status_code=200,
        cookies={"login": "cookie-value"},
    )

    result = wallet_client.login("testemail@gmail.com", "password")

    assert result == {"login": "cookie-value"}
    mock_session.post.assert_called_once_with(
        f"{WALTID_WALLET_URL}/wallet-api/auth/login",
        json={
            "type": "email",
            "email": "testemail@gmail.com",
            "password": "password",
        },
        timeout=10,
    )


def test_login_returns_none_on_failure(wallet_client, mock_session):
    """Test login"""
    mock_session.post.return_value = make_response(status_code=401)

    assert wallet_client.login("testemail@gmail.com", "password") is None


def test_get_wallet_returns_first_wallet_id_and_caches_it(
        wallet_client, mock_session):
    """Test cachine the wallet id"""
    mock_session.get.return_value = make_response(
        status_code=200,
        json_data={"wallets": [{"id": "wallet-123"}]},
    )

    result_1 = wallet_client.get_wallet()
    result_2 = wallet_client.get_wallet()

    assert result_1 == "wallet-123"
    assert result_2 == "wallet-123"
    mock_session.get.assert_called_once_with(
        f"{WALTID_WALLET_URL}/wallet-api/wallet/accounts/wallets",
        timeout=10,
    )


def test_get_wallet_returns_none_when_no_wallets(wallet_client, mock_session):
    """Test getting wallet with no wallets"""
    mock_session.get.return_value = make_response(
        status_code=200,
        json_data={"wallets": []},
    )

    assert wallet_client.get_wallet() is None


def test_create_key_returns_text_on_201(wallet_client, mock_session):
    """Test creating key"""
    wallet_client._wallet_id = "wallet-123"
    mock_session.post.return_value = make_response(
        status_code=201, text="key-abc")

    result = wallet_client.create_key("Ed25519")

    assert result == "key-abc"
    mock_session.post.assert_called_once_with(
        f"{WALTID_WALLET_URL}/wallet-api/wallet/wallet-123/keys/generate",
        json={
            "backend": "jwk",
            "keyType": "Ed25519",
        },
        timeout=10,
    )


def test_create_key_returns_none_on_failure(wallet_client, mock_session):
    """Test creating key"""
    wallet_client._wallet_id = "wallet-123"
    mock_session.post.return_value = make_response(status_code=400)

    assert wallet_client.create_key("Ed25519") is None


def test_create_did_jwk_returns_text_on_200(wallet_client, mock_session):
    """Test creating did"""
    wallet_client._wallet_id = "wallet-123"
    mock_session.post.return_value = make_response(
        status_code=200, text="did:jwk:abc")

    assert wallet_client.create_did_jwk() == "did:jwk:abc"


def test_create_did_jwk_returns_text_on_409(wallet_client, mock_session):
    """Test creating did"""
    wallet_client._wallet_id = "wallet-123"
    mock_session.post.return_value = make_response(
        status_code=409, text="did:jwk:abc")

    assert wallet_client.create_did_jwk() == "did:jwk:abc"


def test_get_did_returns_json_on_200(wallet_client, mock_session):
    """Test getting did"""
    wallet_client._wallet_id = "wallet-123"
    mock_session.get.return_value = make_response(
        status_code=200,
        json_data={"id": "did:jwk:abc"},
    )

    assert wallet_client.get_did("did:jwk:abc") == {"id": "did:jwk:abc"}


def test_delete_did_returns_true_on_202(wallet_client, mock_session):
    """Test deleting did"""
    wallet_client._wallet_id = "wallet-123"
    mock_session.delete.return_value = make_response(status_code=202)

    assert wallet_client.delete_did("did:jwk:abc") is True


def test_receive_credential_returns_json_on_200(wallet_client, mock_session):
    """Test receiving credential"""
    wallet_client._wallet_id = "wallet-123"
    mock_session.post.return_value = make_response(
        status_code=200,
        json_data=[{"id": "cred-1"}],
    )

    result = wallet_client.receive_credential("offer-url", "did:jwk:abc")

    assert result == [{"id": "cred-1"}]
    mock_session.post.assert_called_once_with(
        f"{WALTID_WALLET_URL}/wallet-api/wallet/wallet-123/exchange/useOfferRequest",
        params={
            "did": "did:jwk:abc",
            "requireUserInput": True,
        },
        data="offer-url",
        headers={
            "Content-Type": "text/plain"},
        timeout=10,
    )


def test_receive_credential_returns_none_on_failure(
        wallet_client, mock_session):
    """Test receiving credential"""
    wallet_client._wallet_id = "wallet-123"
    mock_session.post.return_value = make_response(status_code=400)

    assert wallet_client.receive_credential("offer-url", "did:jwk:abc") is None


def test_get_credential_returns_json_on_200(wallet_client, mock_session):
    """Test getting credential"""
    wallet_client._wallet_id = "wallet-123"
    mock_session.get.return_value = make_response(
        status_code=200,
        json_data={"id": "cred-1"},
    )

    assert wallet_client.get_credential("cred-1") == {"id": "cred-1"}


def test_accept_credential_returns_true_on_202(wallet_client, mock_session):
    """Test accepting credential"""
    wallet_client._wallet_id = "wallet-123"
    mock_session.post.return_value = make_response(status_code=202)

    assert wallet_client.accept_credential("cred-1") is True


def test_accept_credential_returns_false_on_failure(
        wallet_client, mock_session):
    """Test accepting credential"""
    wallet_client._wallet_id = "wallet-123"
    mock_session.post.return_value = make_response(status_code=400)

    assert wallet_client.accept_credential("cred-1") is False


def test_set_cookies_replaces_session_cookies(wallet_client, mock_session):
    """Test setting cookies"""
    wallet_client.set_cookies({"login": "abc", "other": "123"})

    mock_session.cookies.clear.assert_called_once()
    mock_session.cookies.set.assert_any_call("login", "abc")
    mock_session.cookies.set.assert_any_call("other", "123")


def test_preview_offer_returns_first_received_credential(wallet_client):
    """Test previewing offer"""
    wallet_client.receive_credential = Mock(
        return_value=[{"id": "cred-1"}, {"id": "cred-2"}])

    result = wallet_client.preview_offer("offer-url", "did:jwk:abc")

    assert result == {"id": "cred-1"}


def test_preview_offer_returns_none_when_receive_returns_none(wallet_client):
    """Test previewing offer"""
    wallet_client.receive_credential = Mock(return_value=None)

    assert wallet_client.preview_offer("offer-url", "did:jwk:abc") is None
