"""
Wallet package.

Provides the main wallet facade and underlying Walt.id client
for credential management, authentication, and presentation flows.
"""

from .wallet import Wallet, wallet
from .waltid_wallet import WaltIdWallet
from .waltidissuer import WaltIdIssuer

__all__ = ["Wallet", "wallet", "WaltIdWallet"]
