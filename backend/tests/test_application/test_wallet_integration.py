"""These tests test the functionality of various wallet operations"""
# pylint: disable=redefined-outer-name

import pytest
import requests

from wallet import Wallet

pytestmark = pytest.mark.integration

TEST_ACCOUNT_EMAIL="testemail@gmail.com"
TEST_ACCOUNT_PASSWORD="password"
TEST_CREDENTIAL_TYPE="Aml"
TEST_ISSUER_ENDPOINT="http://localhost:8000/api/openid4vc/jwt/issue"


@pytest.fixture
def wallet():
    """Creates a wallet with an account and logs into it"""
    test_wallet = Wallet()
    test_wallet.register("name", TEST_ACCOUNT_EMAIL, TEST_ACCOUNT_PASSWORD)
    test_wallet.set_cookies(test_wallet.login(TEST_ACCOUNT_EMAIL, TEST_ACCOUNT_PASSWORD))

    yield test_wallet

    test_wallet.logout()


@pytest.fixture
def credential(wallet):
    """Creates a credential for the wallet"""
    offer_url = requests.post(TEST_ISSUER_ENDPOINT,
                              params={"cred_type": TEST_CREDENTIAL_TYPE}, timeout=10) \
                              .json().get("issuance_url", "")

    test_credential = wallet.receive_credential(offer_url, wallet.create_did("jwk"))[0]
    yield test_credential

    wallet.delete_credential(test_credential)


@pytest.fixture
def did(wallet):
    """Creates a did for the wallet"""
    test_did = wallet.create_did("jwk")
    yield test_did

    wallet.delete_did(test_did)


@pytest.fixture
def key(wallet):
    """"Creates a key for the wallet"""
    test_key = wallet.create_key("Ed25519")
    yield test_key

    wallet.delete_key(test_key)


@pytest.fixture
def empty_wallet():
    """Creates an empty wallet with no accounts"""
    return Wallet()


@pytest.mark.parametrize(
    "email,password,expected_value",
    [
        ("testemail@gmail.com", "password", True),
        ("", "password", False),
        ("testemail@gmail.com", "", False)
    ]
)
def test_register(email: str, password: str, empty_wallet, expected_value):
    """Tests various email password combos for registering an account"""
    assert empty_wallet.register(email, email, password) == expected_value


@pytest.mark.parametrize(
    "email,password,expected_value",
    [
        ("something@gmail.com", "password", dict),
        ("", "password", type(None)),
        ("something@gmail.com", "", type(None))
    ]
)
def test_login(email: str, password: str, empty_wallet, expected_value):
    """Tests various email password combos for logging in"""
    empty_wallet.register(email, email, password)
    assert isinstance(empty_wallet.login(email, password), expected_value)


def test_logout(wallet):
    """Tests logout"""
    wallet.set_cookies(wallet.login(TEST_ACCOUNT_EMAIL, TEST_ACCOUNT_PASSWORD))
    assert wallet.logout() is True


@pytest.mark.parametrize(
    "key_type,expected_value",
    [
        ("Ed25519", str),
        ("secp256k1", str),
        ("secp256r1", str),
        ("RSA", str),
        ("Bad_type", type(None)),
        ("", type(None))
    ]
)
def test_create_key(key_type: str, wallet, expected_value):
    """Tests all possible key_types for creating a key"""
    assert isinstance(wallet.create_key(key_type), expected_value)


def test_get_key(wallet, key):
    """Tests getting a key"""
    assert isinstance(wallet.get_key(key), dict)
    assert isinstance(wallet.get_key("non-existent key"), type(None))


def test_delete_key(wallet, key):
    """Tests deleting a key"""
    assert isinstance(wallet.get_key(key), dict)
    assert wallet.delete_key(key) is True
    assert wallet.delete_key("non-existent key") is False


def test_get_keys(wallet):
    """Tests getting all keys by checking if the size of the returned keys 
    is incremented by one after creating a new one"""
    key_count = len(wallet.get_keys())

    wallet.create_key("Ed25519")
    assert len(wallet.get_keys()) > key_count

    wallet.set_cookies({})
    assert wallet.get_keys() is None


@pytest.mark.parametrize(
    "did_type,expected_value",
    [
        ("jwk", str),
        ("key", type(None)),
        ("web", type(None)),
        ("", type(None))
    ]
)
def test_create_did(did_type: str, wallet, expected_value):
    """Tests creating a did with each of the possible did_types"""
    assert isinstance(wallet.create_did(did_type), expected_value)

    wallet.set_cookies({})
    assert wallet.create_did(did_type) is None


def test_get_did(wallet, did):
    """Tests getting a did"""
    assert isinstance(wallet.get_did(did), dict)
    assert isinstance(wallet.get_did("non-existent did"), type(None))


def test_delete_did(wallet, did):
    """Tests deleting a did"""
    assert isinstance(wallet.get_did(did), dict)
    assert wallet.delete_did(did) is True
    assert wallet.delete_did("non-existent did") is False


def test_get_dids(wallet):
    """Tests getting all dids by checking if the size of the returned dids 
    is incremented by one after creating a new one"""
    key_count = len(wallet.get_dids())

    wallet.create_did("jwk")
    assert len(wallet.get_dids()) > key_count

    wallet.set_cookies({})
    assert wallet.get_dids() is None


def test_receive_credential(wallet, did):
    """Tests receiving a credential by generating an offer url and receiving it"""
    offer_url = requests.post(TEST_ISSUER_ENDPOINT,
                              params={"cred_type": TEST_CREDENTIAL_TYPE}, timeout=10) \
                              .json().get("issuance_url", "")

    wallet.receive_credential(offer_url, wallet.create_did("jwk"))

    assert isinstance(wallet.receive_credential(offer_url, did), list)
    assert isinstance(wallet.receive_credential("", did), type(None))


def test_preview_credential(wallet, did):
    """Tests previewing a credential from an offer"""
    offer_url = requests.post(TEST_ISSUER_ENDPOINT,
                              params={"cred_type": TEST_CREDENTIAL_TYPE}, timeout=10) \
                              .json().get("issuance_url", "")

    assert isinstance(wallet.preview_credential_offer(offer_url, did), dict)


def test_accept_credential(wallet, credential):
    """Tests accepting a credential"""
    assert wallet.accept_credential(credential) is True


def test_get_credential(wallet, credential):
    """Tests getting a credential"""
    assert isinstance(wallet.get_credential(credential), dict)


def test_delete_credential(wallet, credential):
    """Tests deleting a credential"""
    assert isinstance(wallet.get_credential(credential), dict)

    wallet.delete_credential(credential)

    assert isinstance(wallet.get_credential(credential), type(None))


def test_get_credentials(wallet):
    """Tests getting all credentials by checking if the size of the returned credentials 
    is incremented by one after creating a new one"""
    assert isinstance(wallet.get_credentials(), list)

    wallet.set_cookies({})
    assert wallet.get_credentials() is None


def test_get_credential_status(wallet, credential):
    """Tests getting the status of a credential"""
    assert wallet.get_credential_status(credential) == "valid"
