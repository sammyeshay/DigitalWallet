"""
Optional integration tests for WaltIdWallet against a live Walt.id service.
"""
# pylint: disable=redefined-outer-name
# pylint: disable=protected-access

import os

import pytest
import requests

from wallet import WaltIdWallet

pytestmark = pytest.mark.integration

WALTID_WALLET_URL = os.getenv("WALTID_WALLET_URL", "http://localhost:7001")
WALTID_WALLET_NAME = "test_name"
WALTID_WALLET_EMAIL = "testemail44@gmail.com"
WALTID_WALLET_PASSWORD = "password"


@pytest.fixture
def empty_wallet_client():
    """Create empty wallet client"""
    session = requests.Session()
    return WaltIdWallet(session, WALTID_WALLET_URL)


def test_register_integration(empty_wallet_client):
    """Test registering"""
    assert empty_wallet_client.register(
        WALTID_WALLET_NAME,
        WALTID_WALLET_EMAIL,
        WALTID_WALLET_PASSWORD,
    ) is True


def test_login_integration(empty_wallet_client):
    """Test login"""
    empty_wallet_client.register(
        WALTID_WALLET_NAME,
        WALTID_WALLET_EMAIL,
        WALTID_WALLET_PASSWORD,
    )
    result = empty_wallet_client.login(
        WALTID_WALLET_EMAIL,
        WALTID_WALLET_PASSWORD,
    )
    assert isinstance(result, dict)
