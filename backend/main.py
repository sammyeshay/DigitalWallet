"""
Application entry point for running wallet and status manager FastAPI services.
"""

import subprocess

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from presentation import issuer_router, status_manager_router, verifier_router, wallet_router
from presentation.issuer.issuer_page import router as issuer_page_router
from presentation.verifier.verifier_page import router as verifier_page_router

wallet_app = FastAPI(version="1.0.0")
wallet_app.mount(
    "/static/verifier",
    StaticFiles(directory="presentation/verifier/static"),
    name="static-verifier",
)
wallet_app.mount(
    "/static/issuer", StaticFiles(directory="presentation/issuer/static"), name="static-issuer"
)
wallet_app.mount(
    "/static/shared", StaticFiles(directory="presentation/shared/static"), name="static-shared"
)
wallet_app.include_router(wallet_router, prefix="/api")
wallet_app.include_router(verifier_router, prefix="/api")
wallet_app.include_router(issuer_router, prefix="/api")
wallet_app.include_router(verifier_page_router)
wallet_app.include_router(issuer_page_router)

status_manager_app = FastAPI(version="1.0.0")
status_manager_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
status_manager_app.include_router(status_manager_router, prefix="/api")


if __name__ == "__main__":
    try:
        wallet_process = subprocess.Popen(  # pylint: disable=consider-using-with
            ["uvicorn", "main:wallet_app", "--host", "0.0.0.0", "--port", "8000"]
        )
        status_manager_process = subprocess.Popen(  # pylint: disable=consider-using-with
            ["uvicorn", "main:status_manager_app", "--host", "0.0.0.0", "--port", "8001"]
        )

        wallet_process.wait()
        status_manager_process.wait()

    except KeyboardInterrupt:
        wallet_process.terminate()
        status_manager_process.terminate()

        wallet_process.wait()
        status_manager_process.wait()
