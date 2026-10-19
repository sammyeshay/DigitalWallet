"""These tests test the functionality of various wallet operations"""

from unittest.mock import Mock

import pytest

from wallet import Wallet

TEST_ACCOUNT_EMAIL="email@gmail.com"
TEST_ACCOUNT_PASSWORD="password"
TEST_CREDENTIAL_TYPE="aml"

WALTID_WALLET_URL = "http://localhost:7001"

# pylint: disable=redefined-outer-name

"""
This testing skips a majority of the functions in the wallet/wallet.py file as they are just 
wrappers forfunctions in wallet/waltid_wallet.py which have their own unit tests. 
The functions tested here have some logic in the wallet/wallet.py file
"""

@pytest.fixture
def mock_wallet():
    """
    Creates mocked wallet
    """
    mock_waltid_wallet = Mock()

    return Wallet(mock_waltid_wallet)


@pytest.mark.parametrize(
    "did_type,expected_value",
    [
        ("jwk", "did:jwk:aabb"),
        ("key", None),
        ("web", None),
        ("", None)
    ]
)
def test_create_did(did_type: str, mock_wallet, expected_value):
    """
    Mocks and tests the creation of the did
    """
    mock_wallet.waltid_wallet.create_did_jwk.return_value = expected_value

    assert mock_wallet.create_did(did_type) == expected_value


@pytest.mark.parametrize(
    "credentials,expected_value",
    [
        (
            [{"id": "urn:uuid:cac34fd5-dc19-44ad-b544-24eee9ac44d4"},
            {"id": "urn:uuid:5cb49a43-2b6d-4ac4-ab5e-e4a995fa56b6"},
            {"id": "urn:uuid:de0d9590-b26a-40c7-bac6-0f55546ef1fe"}],
            ["urn:uuid:cac34fd5-dc19-44ad-b544-24eee9ac44d4",
            "urn:uuid:5cb49a43-2b6d-4ac4-ab5e-e4a995fa56b6",
            "urn:uuid:de0d9590-b26a-40c7-bac6-0f55546ef1fe"]
        ),
        ([], None)
    ]
)
def test_receive_credential(credentials, mock_wallet, expected_value):
    """
    Mocks and tests receving a credential
    """
    mock_wallet.waltid_wallet.receive_credential.return_value = credentials

    assert mock_wallet.receive_credential("offer", "did") == expected_value


@pytest.mark.parametrize(
    "credential,expected_value",
    [
        ({"parsedDocument": {}}, "valid"),
        ({"parsedDocument": {"credentialStatus": {}}}, "valid"),
        ({"validUntil": "2027-04-05T14:27:40Z"}, "valid"),
        ({"validUntil": "2022-04-05T14:27:40Z"}, "expired"),
    ]
)
def test_get_credential_status(credential, mock_wallet, expected_value):
    """
    Mocks and tests retreving the status of a credential
    """
    mock_wallet.waltid_wallet.get_credential.return_value = credential

    assert mock_wallet.get_credential_status("urn:uuid:mock") == expected_value

def test_get_credential_status_none__found(mock_wallet):
    """Tests that get_credential_status returns None when credential does not exist."""
    mock_wallet.waltid_wallet.get_credential.return_value = None

    assert mock_wallet.get_credential_status("urn:uuid:nonexistent") is None

@pytest.mark.parametrize(
    "dids,expected_value",
    [
        (["did:jwk:mock", "did:jwk:mock2"], "did:jwk:mock"),
        ([{"did": "did:jwk:mock"}, {"did": "did:jwk:mock2"}], "did:jwk:mock"),
        ([{"id": "did:jwk:mock"}, {"id": "did:jwk:mock2"}], "did:jwk:mock"),
        ({"dids": ["did:jwk:mock", "did:jwk:mock2"]}, "did:jwk:mock"),
        ({"dids": [{"did": "did:jwk:mock"}, {"did": "did:jwk:mock2"}]}, "did:jwk:mock"),
        ({"dids": [{"id": "did:jwk:mock"}, {"id": "did:jwk:mock2"}]}, "did:jwk:mock")
    ]
)
def test_ensure_did(dids, mock_wallet, expected_value):
    """
    Mocks and tests that a did exists
    """
    mock_wallet.waltid_wallet.get_dids.return_value = dids

    assert mock_wallet.ensure_did() == expected_value

def test_ensure_did_none_exist(mock_wallet):
    """Tests that ensure_did creates a new did when the wallet has none."""
    mock_wallet.waltid_wallet.get_dids.return_value = []
    mock_wallet.waltid_wallet.create_did_jwk.return_value = "did:jwk:new"

    result = mock_wallet.ensure_did()

    assert result == "did:jwk:new"
    mock_wallet.waltid_wallet.create_did_jwk.assert_called_once()


def test_ensure_did_creation_fails(mock_wallet):
    """Tests that ensure_did returns None when there are no dids and creation fails."""
    mock_wallet.waltid_wallet.get_dids.return_value = []
    mock_wallet.waltid_wallet.create_did_jwk.return_value = None

    result = mock_wallet.ensure_did()

    assert result is None

def test_preview_credential_offer(mock_wallet):
    """Tests that preview_credential_offer returns the first credential from the offer."""
    mock_wallet.waltid_wallet.receive_credential.return_value = [
        {"id": "urn:uuid:preview-cred"}
    ]

    result = mock_wallet.preview_credential_offer("offer-url", "did:jwk:abc")

    assert result == {"id": "urn:uuid:preview-cred"}

def test_preview_credential_offer_failure(mock_wallet):
    """Tests that preview_credential_offer returns None when receive fails."""
    mock_wallet.waltid_wallet.receive_credential.return_value = None

    result = mock_wallet.preview_credential_offer("bad-offer-url", "did:jwk:abc")

    assert result is None
