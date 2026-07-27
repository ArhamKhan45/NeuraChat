import asyncio
import os
from typing import Annotated

import httpx
from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import (
    Depends,
    HTTPException,
    Request,
    status,
)
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.features.user import UserModel


DatabaseSession = Annotated[
    AsyncSession,
    Depends(get_db),
]


CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_AUTHORIZED_PARTY = os.getenv(
    "CLERK_AUTHORIZED_PARTY",
    "http://localhost:3000",
)


if not CLERK_SECRET_KEY:
    raise RuntimeError(
        "CLERK_SECRET_KEY environment variable is not configured"
    )


clerk = Clerk(
    bearer_auth=CLERK_SECRET_KEY,
)


def authentication_error() -> HTTPException:
    """Return a standard Clerk authentication error."""

    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate Clerk authentication credentials",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )


def authenticate_clerk_request(
    request: Request,
):
    """
    Authenticate a FastAPI request using Clerk's Python backend SDK.

    The FastAPI request is converted into an httpx request because Clerk's
    authenticate_request method expects an HTTP request-like object.
    """

    httpx_request = httpx.Request(
        method=request.method,
        url=str(request.url),
        headers=dict(request.headers),
    )

    return clerk.authenticate_request(
        httpx_request,
        AuthenticateRequestOptions(
            authorized_parties=[
                CLERK_AUTHORIZED_PARTY,
            ],
        ),
    )


async def get_current_user(
    request: Request,
    db: DatabaseSession,
) -> UserModel:
    """
    Authenticate the request with Clerk and return the local database user.

    Clerk verifies the session token. The Clerk user ID is obtained from the
    verified token payload and matched against the users table.
    """

    try:
        request_state = await asyncio.to_thread(
            authenticate_clerk_request,
            request,
        )

    except Exception as error:
        raise authentication_error() from error

    if not request_state.is_signed_in:
        raise authentication_error()

    payload = request_state.payload

    if payload is None:
        raise authentication_error()

    clerk_id = payload.get("sub")

    if not isinstance(clerk_id, str) or not clerk_id:
        raise authentication_error()

    try:
        statement = select(UserModel).where(
            UserModel.clerk_id == clerk_id
        )

        result = await db.execute(statement)
        user = result.scalar_one_or_none()

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while retrieving authenticated user",
        ) from error

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clerk user is not registered in the application database",
        )

    return user


CurrentUser = Annotated[
    UserModel,
    Depends(get_current_user),
]