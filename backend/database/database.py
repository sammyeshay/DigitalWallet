"""
Lightweight SQLite database wrapper for executing basic CRUD operations.
"""

import sqlite3
from typing import Any, NamedTuple


class QueryResult(NamedTuple):
    """Represents the result of a database query."""

    rows: list[dict]
    row_count: int


def dict_factory(cursor, row):
    """Convert SQLite rows into dictionaries."""
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


class Database:
    """Simple database abstraction for executing SQL queries."""

    connection = None
    cursor = None

    def __init__(self, database_file: str):
        """Initialise database connection."""
        try:
            self.connection = sqlite3.connect(database_file)
            self.connection.row_factory = dict_factory
            self.cursor = self.connection.cursor()
        except sqlite3.Error as error:
            print("sqlite3 error creating connection", error)

    def execute_query(self, query: str) -> QueryResult:
        """
        Execute a SQL query and return a structured result.

        Args:
            query: SQL query string.

        Returns:
            QueryResult containing rows and affected row count.
        """
        print(query)

        try:
            result = self.cursor.execute(query)
        except sqlite3.Error as error:
            print("sqlite3 error:", error)
            return QueryResult([], -1)

        command = query.split(" ", 1)[0].upper()

        if command == "CREATE":
            return QueryResult([], 0)
        if command in {"INSERT", "DELETE"}:
            return QueryResult([], result.rowcount)
        if command == "SELECT":
            return QueryResult(result.fetchall(), result.rowcount)

        return QueryResult([], -1)

    def create_table(self, table: str, columns: list[str]) -> bool:
        """
        Create a table if it does not exist.

        Args:
            table: Table name.
            columns: List of column definitions.

        Returns:
            True if table was newly created, else False.
        """
        query = f"CREATE TABLE IF NOT EXISTS {table} ({', '.join(columns)})"

        before_count = len(self.select_record("sqlite_master", ["name"], []))
        self.execute_query(query)
        after_count = len(self.select_record("sqlite_master", ["name"], []))

        return after_count > before_count

    def insert_record(
        self,
        table: str,
        record: list[Any] | list[tuple[str, Any]],
    ) -> int:
        """
        Insert a record into a table.

        Args:
            table: Table name.
            record: Either list of values or list of (column, value) tuples.

        Returns:
            Number of rows inserted, or -1 if invalid input.
        """
        if not record:
            return -1

        if not isinstance(record[0], tuple):
            values = ", ".join(f"'{str(item)}'" for item in record)
            query = f"INSERT INTO {table} VALUES ({values})"
        else:
            columns = [col for col, _ in record]
            values = [val for _, val in record]

            column_str = ", ".join(columns)
            value_str = ", ".join(f"'{str(item)}'" for item in values)

            query = f"INSERT INTO {table} ({column_str}) VALUES ({value_str})"

        return self.execute_query(query).row_count

    def delete_records(
        self,
        table: str,
        conditions: list[tuple[str, str, Any]],
    ) -> int:
        """
        Delete records matching given conditions.

        Args:
            table: Table name.
            conditions: List of (column, operator, value) tuples.

        Returns:
            Number of rows deleted, or -1 if no conditions provided.
        """
        if not conditions:
            return -1

        where_clause = " AND ".join(
            f"{column} {operator} '{value}'"
            for column, operator, value in conditions
        )

        query = f"DELETE FROM {table} WHERE {where_clause}"
        return self.execute_query(query).row_count

    def select_record(
        self,
        table: str,
        columns: list[str],
        conditions: list[tuple[str, str, Any]] | None = None,
    ) -> list[dict]:
        """
        Select records from a table.

        Args:
            table: Table name.
            columns: List of column names.
            conditions: Optional list of conditions.

        Returns:
            List of records as dictionaries.
        """
        if not columns:
            return []

        column_str = ", ".join(columns)

        if not conditions:
            query = f"SELECT {column_str} FROM {table}"
        else:
            where_clause = " AND ".join(
                f"{column} {operator} '{value}'"
                for column, operator, value in conditions
            )
            query = f"SELECT {column_str} FROM {table} WHERE {where_clause}"

        return self.execute_query(query).rows

    def close(self) -> None:
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            self.connection = None
            self.cursor = None
