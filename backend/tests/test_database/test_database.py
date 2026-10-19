"""
Tests for the lightweight SQLite database wrapper.
"""
# pylint: disable=redefined-outer-name

import os

import pytest

from database import Database

TEST_DATABASE_FILE = "test_database.db"


@pytest.fixture
def empty_database():
    """Provide a fresh empty test database and clean it up afterwards."""
    if os.path.exists(TEST_DATABASE_FILE):
        os.remove(TEST_DATABASE_FILE)

    db = Database(TEST_DATABASE_FILE)
    yield db
    db.close()

    if os.path.exists(TEST_DATABASE_FILE):
        os.remove(TEST_DATABASE_FILE)


@pytest.fixture
def populated_database(empty_database):
    """Provide a test database pre-populated with a sample table and rows."""
    empty_database.create_table("test_table", ["name", "age", "suburb"])

    empty_database.insert_record("test_table", ["john", 20, "eastwood"])
    empty_database.insert_record("test_table", ["ben", 22, "kellyville"])
    empty_database.insert_record("test_table", ["jack", 48, "denistone"])
    empty_database.insert_record("test_table", ["nick", 65, "epping"])
    empty_database.insert_record("test_table", ["jim", 12, "rhodes"])

    yield empty_database


@pytest.mark.parametrize(
    "table,columns,expected_value",
    [
        ("test_table", ["name", "age", "suburb"], True),
        ("", ["name", "age", "suburb"], False),
        ("test_table", [], False),
    ],
)
def test_database_create_table(table, columns, expected_value, empty_database):
    """Test table creation behaviour for valid and invalid inputs."""
    assert empty_database.create_table(table, columns) == expected_value


@pytest.mark.parametrize(
    "table,record,expected_value",
    [
        ("test_table", ["john", 20, "ryde"], 1),
        ("test_table", [("name", "john"), ("age", 20), ("suburb", "ryde")], 1),
        ("", ["john", 20, "ryde"], -1),
        ("non_existing_table", ["john", 20, "ryde"], -1),
        ("test_table", ["john", 20, "ryde", "bad_value"], -1),
        (
            "test_table",
            [("bad_column", "john"), ("age", 20), ("suburb", "ryde")],
            -1,
        ),
    ],
)
def test_database_insert_record(
        table,
        record,
        expected_value,
        populated_database):
    """Test inserting records into the database."""
    assert populated_database.insert_record(table, record) == expected_value


@pytest.mark.parametrize(
    "table,conditions,expected_value",
    [
        ("test_table", [("name", "=", "john"), ("age", "=", 20)], 1),
        ("test_table", [("age", ">=", 22)], 3),
        ("test_table", [("name", "=", "john"), ("suburb", "=", "rhodes")], 0),
        ("test_table", [("bad_column", "=", "john"), ("suburb", "=", "rhodes")], -1),
        ("", [("name", "=", "john")], -1),
    ],
)
def test_database_delete_record(
        table,
        conditions,
        expected_value,
        populated_database):
    """Test deleting records using condition filters."""
    assert populated_database.delete_records(
        table, conditions) == expected_value


@pytest.mark.parametrize(
    "table,columns,conditions,expected_value",
    [
        (
            "test_table",
            ["name", "age", "suburb"],
            [("name", "=", "john")],
            [{"name": "john", "age": "20", "suburb": "eastwood"}],
        ),
        (
            "test_table",
            ["name"],
            [("name", "=", "john")],
            [{"name": "john"}],
        ),
        (
            "test_table",
            ["name", "age", "suburb"],
            [("age", ">=", "22")],
            [
                {"name": "ben", "age": "22", "suburb": "kellyville"},
                {"name": "jack", "age": "48", "suburb": "denistone"},
                {"name": "nick", "age": "65", "suburb": "epping"},
            ],
        ),
        (
            "test_table",
            ["name", "age", "suburb"],
            [("name", "=", "smith")],
            [],
        ),
        (
            "test_table",
            ["bad_column", "age", "suburb"],
            [],
            [],
        ),
    ],
)
def test_database_select_record(
    table,
    columns,
    conditions,
    expected_value,
    populated_database,
):
    """Test selecting records with different column and condition combinations."""
    assert populated_database.select_record(
        table, columns, conditions) == expected_value
