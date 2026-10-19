"""
Tests the routes in presentation/routes/status_manager.py. It tests the functions for the routes
rather than calling the routes using HTTP. This is so the code coverage will be counted.
"""

# pylint: disable=redefined-outer-name

import asyncio
from unittest.mock import Mock, patch

import pytest
import fastapi

from presentation.routes.status_manager import (
    generate_status_list_index,
    set_status_list_index,
    get_status_list_index,
    get_status_list,
    get_status_list_credential,
)

MODULE = "presentation.routes.status_manager"

@pytest.fixture
def mock_status_manager():
    """Replaces real wallet with mocked one for tests"""
    with patch(f"{MODULE}.status_manager") as mocked:
        yield mocked

def test_generate_status_list_index(mock_status_manager):
    """Tests generate status list index route"""
    mock_status_manager.generate_status_list_index.return_value = 42

    result = asyncio.run(
        generate_status_list_index(fastapi.Response(), Mock())
    )

    assert result == 42


def test_generate_status_list_index_zero_error(mock_status_manager):
    """Tests generate status list index route upon zero error"""
    mock_status_manager.generate_status_list_index.return_value = 0
    response = fastapi.Response()

    result = asyncio.run(
        generate_status_list_index(response, Mock())
    )

    assert result == {"error": "Failed to generate new status list index"}
    assert response.status_code == 400


def test_generate_status_list_index_error_negative(mock_status_manager):
    """Tests generate status list index route upon negative error"""
    mock_status_manager.generate_status_list_index.return_value = -1
    response = fastapi.Response()

    result = asyncio.run(
        generate_status_list_index(response, Mock())
    )

    assert result == {"error": "Failed to generate new status list index"}
    assert response.status_code == 400

def test_set_status_list_index(mock_status_manager):
    """Tests set status list index route"""
    mock_status_manager.set_status_list_index.return_value = 1

    result = asyncio.run(
        set_status_list_index(fastapi.Response(), Mock(), index=200, value=True)
    )

    assert result == {}
    mock_status_manager.set_status_list_index.assert_called_once_with(200, True)


def test_set_status_list_index_error_zero(mock_status_manager):
    """Tests set status list index route on zero error"""
    mock_status_manager.set_status_list_index.return_value = 0
    response = fastapi.Response()

    result = asyncio.run(
        set_status_list_index(response, Mock(), index=200, value=False)
    )

    assert result == {"error": "Failed to set status list index value"}
    assert response.status_code == 400


def test_set_status_list_index_error_negative(mock_status_manager):
    """Tests set status list index route on negative error"""
    mock_status_manager.set_status_list_index.return_value = -1
    response = fastapi.Response()

    result = asyncio.run(
        set_status_list_index(response, Mock(), index=-1, value=True)
    )

    assert result == {"error": "Failed to set status list index value"}
    assert response.status_code == 400

def test_get_status_list_index_revoked(mock_status_manager):
    """Tests get status list index route when revoked"""
    mock_status_manager.get_status_list_index.return_value = 1

    result = asyncio.run(
        get_status_list_index(fastapi.Response(), Mock(), index=200)
    )

    assert result == "1"
    mock_status_manager.get_status_list_index.assert_called_once_with(200)


def test_get_status_list_index_not_revoked(mock_status_manager):
    """Tests get status list index when not revoked"""
    mock_status_manager.get_status_list_index.return_value = 0

    result = asyncio.run(
        get_status_list_index(fastapi.Response(), Mock(), index=200)
    )

    assert result == "0"


def test_get_status_list_index_error_negative(mock_status_manager):
    """Tests get status list index route on negative error"""
    mock_status_manager.get_status_list_index.return_value = -1
    response = fastapi.Response()

    result = asyncio.run(
        get_status_list_index(response, Mock(), index=-1)
    )

    assert result == {"error": "Failed to get status list index value"}
    assert response.status_code == 400

def test_get_status_list_encoded_list(mock_status_manager):
    """Tests get status list"""
    mock_status_manager.get_status_list.return_value = "encoded-status-list-string"

    result = asyncio.run(
        get_status_list(Mock(), Mock())
    )

    assert result == "encoded-status-list-string"

def test_get_status_list_credential(mock_status_manager):
    """Tests get status list credential"""
    mock_status_manager.get_status_list_credential_jwt.return_value = "jwt.token.string"

    result = asyncio.run(
        get_status_list_credential(Mock(), Mock())
    )

    assert isinstance(result, fastapi.Response)
    assert result.body == b"jwt.token.string"
    assert result.media_type == "application/jwt"
