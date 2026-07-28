import os
from typing import Annotated

import httpx
from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import Depends, HTTPException, Request, status


CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

if not CLERK_SECRET_KEY:
    raise RuntimeError("CLERK_SECRET_KEY is not configured")


clerk = Clerk(
    bearer_auth=CLERK_SECRET_KEY,
)


async def protect_route(
    request: Request,
) -> str:
    """
    Verify the Clerk session and return the Clerk user ID.
    """

    httpx_request = httpx.Request(
        method=request.method,
        url=str(request.url),
        headers=dict(request.headers),
    )

    try:
        request_state = clerk.authenticate_request(
            httpx_request,
            AuthenticateRequestOptions(),
        )

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        ) from error

    if not request_state.is_signed_in:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    clerk_id = request_state.payload.get("sub")

    if not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clerk user ID not found",
        )

    return clerk_id


ProtectedUser = Annotated[
    str,
    Depends(protect_route),
]