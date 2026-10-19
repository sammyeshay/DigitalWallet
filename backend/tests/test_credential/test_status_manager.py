"""
Tests the status manager which is responsible for handling the status of credentials
"""

import os
import pytest

from credential import StatusManager, decode_decompress_list

TEST_STATUS_LIST="test_bit_string_status_list.json"

# pylint: disable=redefined-outer-name

@pytest.fixture
def status_manager():
    """Creates a status manager with no used indicies and all bits set to 0"""
    if os.path.exists(TEST_STATUS_LIST):
        os.remove(TEST_STATUS_LIST)

    with open(TEST_STATUS_LIST, "w", encoding="utf-8") as file:
        file.write("{}")

    file.close()

    yield StatusManager(TEST_STATUS_LIST)

    if os.path.exists(TEST_STATUS_LIST):
        os.remove(TEST_STATUS_LIST)


def test_generate_status_list_index(status_manager):
    """Checks that an index above or equal to 0 is generated"""
    assert status_manager.generate_status_list_index() >= 0


@pytest.mark.parametrize(
    "index,value,get_expected_value,set_expected_value",
    [
        (200, 1, 1, 1),
        (200, 0, 0, 1),
        (500, 0, 0, 1),
        (500, 1, 1, 1),
        (-1, 1, -1, -1),
        (1000000, 1, -1, -1)
    ]
)
def test_get_set_status_list_index(index: int, value: int, status_manager,
                                   get_expected_value: int,
                                   set_expected_value: int):
    """Tests that setting and getting the value of an index works"""
    assert status_manager.set_status_list_index(index, value) == set_expected_value
    assert status_manager.get_status_list_index(index) == get_expected_value


@pytest.mark.parametrize(
    "index,value,expected_value",
    [
        (200, 1, 1),
        (200, 0, 0)
    ]
)
def test_get_status_list(index: int, value: int, status_manager, expected_value: int):
    """Tests that the status list can be encoded and compressed, 
    decompressed and decoded and then read"""
    status_manager.set_status_list_index(index, value)
    encoded_status_list = status_manager.get_status_list()

    status_list = decode_decompress_list(encoded_status_list)

    assert status_list[index] == expected_value
