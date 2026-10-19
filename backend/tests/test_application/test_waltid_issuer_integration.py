"""
Optional integration tests for WaltIdIssuer against a live Walt.id service.
"""
# pylint: disable=redefined-outer-name
# pylint: disable=missing-function-docstring
# pylint: disable=protected-access

import asyncio

import pytest
import requests
from fastapi import Request

from presentation.issuer.issuer import get_cred_body
from presentation.issuer.issuer_page import issuer_page
from wallet import WaltIdIssuer

pytestmark = pytest.mark.integration

TEST_WALTID_ISSUER_URL="http://localhost:7002"

@pytest.fixture
def issuer():
    test_session = requests.Session()
    test_issuer = WaltIdIssuer(test_session , TEST_WALTID_ISSUER_URL)

    return test_issuer

@pytest.mark.parametrize(
    "cred_type,expected_result",
    [
        ("Aml", (True, str)),
        ("Corporate", (True, str)),
        ("Director", (True, str)),
        ("Sanction", (True, str)),
        ("Ubo", (True, str)),
        ("Bad cred type", (False, str)),
    ]
)
def test_cred_issuance(cred_type: str, issuer, expected_result):
    ok, cred_body = get_cred_body(cred_type)

    assert ok == expected_result[0]

    result = issuer.cred_issuance(cred_body)

    assert result[0] == expected_result[0]
    assert isinstance(result[1], expected_result[1])


# Single test required for coverage - issuer_page.py
def test_issuer_page_returns():
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/issuer",
        "query_string": b"",
        "headers": [],
    }
    request = Request(scope)
    response = asyncio.run(issuer_page(request))
    assert response.status_code == 200
