"""
Utilities for creating, updating, encoding, decoding, and persisting a
BitStringStatusList used for credential revocation tracking.
"""

import base64
import gzip
import json
import secrets

import datetime
import bitstring


BIT_STRING_STATUS_LIST_KEY = "bit_string_status_list"
BIT_STRING_STATUS_LIST_USED_INDEXES_KEY = "bit_string_status_list_used_indexes"
BIT_STRING_STATUS_LIST_ISSUED_KEY = "bit_string_status_list_issued"

class BitStringStatusList:
    """
    Manage a revocation status list backed by a bitstring and persisted to disk.

    The list is stored in a JSON file alongside the set of used indexes.
    """

    bit_string_status_list = None
    used_indexes = []
    list_file = None
    issued = None  # ← add this

    def __init__(self, file_name: str, length: int = 131072):
        """
        Initialise the status list from a JSON file or create a new empty list.

        Args:
            file_name: Path to the JSON persistence file.
            length: Length of a newly created bitstring list in bits.
        """
        self.list_file = file_name

        with open(self.list_file, "r", encoding="utf-8") as file:
            json_data = json.load(file)

        if BIT_STRING_STATUS_LIST_KEY in json_data:
            self.bit_string_status_list = decode_decompress_list(
                json_data.get(BIT_STRING_STATUS_LIST_KEY)
            )
        else:
            self.bit_string_status_list = bitstring.BitArray(length=length)

        self.used_indexes = json_data.get(BIT_STRING_STATUS_LIST_USED_INDEXES_KEY, [])

        self.issued = json_data.get(
            BIT_STRING_STATUS_LIST_ISSUED_KEY,
            datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        )

    def update_stored_list(self) -> None:
        """
        Persist the encoded status list and used indexes back to the JSON file.
        """
        json_data = {
            BIT_STRING_STATUS_LIST_KEY: self.compress_encode_list(),
            BIT_STRING_STATUS_LIST_USED_INDEXES_KEY: self.used_indexes,
            BIT_STRING_STATUS_LIST_ISSUED_KEY: self.issued,
        }

        with open(self.list_file, "w", encoding="utf-8") as file:
            json.dump(json_data, file)

    def get_bit(self, index: int) -> int:
        """
        Return the bit value at a given index.

        Args:
            index: Bit index from 0 to len(bit_string_status_list) - 1.

        Returns:
            0 or 1 for a valid index, or -1 if the index is invalid.
        """
        if index < 0 or index >= len(self.bit_string_status_list):
            return -1

        return self.bit_string_status_list[index]

    def set_bit(self, index: int, value: int) -> int:
        """
        Set the bit at a given index.

        Args:
            index: Bit index from 0 to len(bit_string_status_list) - 1.
            value: Bit value, expected to be 0 or 1.

        Returns:
            1 if the bit was set successfully, or -1 if the index is invalid.
        """
        if index < 0 or index >= len(self.bit_string_status_list):
            return -1

        self.bit_string_status_list[index] = value
        return 1

    def generate_index(self) -> int:
        """
        Generate a cryptographically secure unused random index.

        Returns:
            A random unused index from 0 to len(bit_string_status_list) - 1,
            or -1 if the list is full.
        """
        # For the default size of 131072 bits, the current implementation is
        # sufficient for project use. List rollover can be introduced later if
        # capacity management becomes necessary.
        list_length = len(self.bit_string_status_list)

        if len(self.used_indexes) >= list_length:
            return -1

        random_index = secrets.randbelow(list_length)

        while random_index in self.used_indexes:
            random_index = secrets.randbelow(list_length)

        self.used_indexes.append(random_index)
        return random_index

    def compress_encode_list(self) -> str:
        """
        Encodes the status list
        """
        compressed_list = gzip.compress(self.bit_string_status_list.tobytes())
        encoded_list = base64.urlsafe_b64encode(compressed_list).rstrip(b"=")
        return "u" + encoded_list.decode("utf-8")  # ← multibase prefix


def decode_decompress_list(encoded_list: str) -> bitstring.BitArray:
    """
    Decodes and decompresses the status list
    """
    if encoded_list.startswith("u"):
        encoded_list = encoded_list[1:]
    padding = "=" * (-len(encoded_list) % 4)
    decoded_list = base64.urlsafe_b64decode(encoded_list + padding)
    decompressed_list = gzip.decompress(decoded_list)
    return bitstring.BitArray(bytes=decompressed_list)
