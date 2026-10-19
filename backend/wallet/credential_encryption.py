"""
Helpers for encrypting and decrypting credential payloads using AES-GCM.
"""

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


class CredentialEncryption:
    """Encrypt and decrypt credential content using a symmetric AES-GCM key."""

    def __init__(self, key: bytes | None = None):
        """Initialise the encryptor with a provided key or generate a new one."""
        self.key = key or AESGCM.generate_key(bit_length=256)
        self.aesgcm = AESGCM(self.key)

    def encrypt(self, contents: str) -> str:
        """Encrypt plaintext credential contents and return a base64 string."""
        nonce = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, contents.encode("utf-8"), None)
        return base64.b64encode(nonce + ciphertext).decode("utf-8")

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt a base64-encoded ciphertext blob and return plaintext."""
        blob = base64.b64decode(ciphertext)
        nonce = blob[:12]
        encrypted_bytes = blob[12:]
        plaintext = self.aesgcm.decrypt(nonce, encrypted_bytes, None)
        return plaintext.decode("utf-8")
