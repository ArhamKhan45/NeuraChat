from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.features.user.model import UserModel
from app.features.user.schema import UserCreate, UserResponse
from app.utils.dependency import DatabaseSession, ProtectedUser


auth_router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@auth_router.post(
    "/sync-user-to-db",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def sync_user_to_db(
    user_data: UserCreate,
    clerk_id: ProtectedUser,
    db: DatabaseSession,
) -> UserModel:
    """
    Return the existing user or create a new database user.
    """

    try:
        result = await db.execute(
            select(UserModel).where(
                UserModel.clerk_id == clerk_id
            )
        )

        existing_user = result.scalar_one_or_none()

        if existing_user is not None:
            return existing_user

        new_user = UserModel(
            clerk_id=clerk_id,
            name=user_data.name,
            email=str(user_data.email),
        )

        db.add(new_user)

        await db.commit()
        await db.refresh(new_user)

        return new_user

    except IntegrityError as error:
        await db.rollback()

        result = await db.execute(
            select(UserModel).where(
                UserModel.clerk_id == clerk_id
            )
        )

        existing_user = result.scalar_one_or_none()

        if existing_user is not None:
            return existing_user

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        ) from error

    except SQLAlchemyError as error:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while synchronizing user",
        ) from error