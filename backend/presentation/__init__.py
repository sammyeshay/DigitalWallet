"""
Presentation layer package.

This package defines API route groupings for the application, including
wallet operations, verification flows, and credential status management.
"""


from .issuer.issuer import router as issuer_router
from .routes.status_manager import router as status_manager_router
from .routes.wallet import router as wallet_router
from .verifier.verifier import router as verifier_router

__all__ = [
    "status_manager_router",
    "verifier_router",
    "wallet_router",
    "issuer_router"
]
