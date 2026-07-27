import asyncio
import os
from typing import Annotated, Any

import jwt
from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.features.user import UserModel


DatabaseSession = Annotated[
    AsyncSession,
    Depends(get_db),
]


bearer_scheme = HTTPBearer(
    auto_error=False,
)


CLERK_ISSUER = os.getenv("CLERK_ISSUER")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
CLERK_AUTHORIZED_PARTY = os.getenv("CLERK_AUTHORIZED_PARTY")


if not CLERK_ISSUER:
    raise RuntimeError(
        "CLERK_ISSUER environment variable is not configured"
    )

if not CLERK_JWKS_URL:
    raise RuntimeError(
        "CLERK_JWKS_URL environment variable is not configured"
    )


jwks_client = PyJWKClient(
    CLERK_JWKS_URL,
    cache_keys=True,
)


def create_authentication_error() -> HTTPException:
    """Create a standard authentication error response."""

    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate Clerk authentication credentials",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )


def verify_clerk_token(token: str) -> dict[str, Any]:
    """
    Verify a Clerk session token and return its payload.

    The token signature is verified using Clerk's JWKS endpoint.
    The issuer, expiration time, and authorized frontend are also checked.
    """

    signing_key = jwks_client.get_signing_key_from_jwt(token)

    payload: dict[str, Any] = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        issuer=CLERK_ISSUER,
        options={
            "verify_aud": False,
            "require": [
                "exp",
                "iat",
                "iss",
                "sub",
            ],
        },
    )

    authorized_party = payload.get("azp")

    if (
        CLERK_AUTHORIZED_PARTY
        and authorized_party != CLERK_AUTHORIZED_PARTY
    ):
        raise jwt.InvalidTokenError(
            "Invalid authorized party"
        )

    return payload


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    db: DatabaseSession,
) -> UserModel:
    """
    Verify the Clerk session token and return the local database user.

    Clerk authenticates the request. The Clerk user ID from the token's
    `sub` claim is used to find the corresponding PostgreSQL user.
    """

    authentication_error = create_authentication_error()

    if credentials is None:
        raise authentication_error

    if credentials.scheme.lower() != "bearer":
        raise authentication_error

    try:
        payload = await asyncio.to_thread(
            verify_clerk_token,
            credentials.credentials,
        )

        clerk_id = payload.get("sub")

        if not isinstance(clerk_id, str) or not clerk_id:
            raise authentication_error

    except HTTPException:
        raise

    except (
        jwt.ExpiredSignatureError,
        jwt.InvalidIssuerError,
        jwt.InvalidTokenError,
        jwt.PyJWKClientError,
        KeyError,
        TypeError,
        ValueError,
    ) as error:
        raise authentication_error from error

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
            detail="Authenticated Clerk user does not exist in the database",
        )

    return user


CurrentUser = Annotated[
    UserModel,
    Depends(get_current_user),
]