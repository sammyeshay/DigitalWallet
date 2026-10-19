from fastapi import HTTPException


def raise_for_service_result(ok: bool, result: str | None, invalid_msg: str) -> None:
    """
    Validate a (ok, result) tuple returned by a Walt.id service call.

    Raises HTTPException 400 if the call failed, or 500 if the result is missing
    or not a string.
    """
    if not ok:
        raise HTTPException(status_code=400, detail=result)

    if not result or not isinstance(result, str):
        raise HTTPException(status_code=500, detail=invalid_msg)