from fastapi import (
    APIRouter,
    HTTPException,
    status,
)
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.features.user import (
    UserCreate,
    UserModel,
    UserResponse,
)
from utils.dependency import DatabaseSession


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/add-user-to-db",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_user_to_db(
    user_data: UserCreate,
    db: DatabaseSession,
) -> UserModel:
    """
    Add a Clerk-authenticated user to the application database.

    Clerk is responsible for authentication. This endpoint only stores
    the Clerk user ID and basic profile information in PostgreSQL.
    """

    try:
        statement = select(UserModel).where(
            or_(
                UserModel.clerk_id == user_data.clerk_id,
                UserModel.email == str(user_data.email),
            )
        )

        result = await db.execute(statement)
        existing_user = result.scalar_one_or_none()

        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exists",
            )

        user = UserModel(
            clerk_id=user_data.clerk_id,
            name=user_data.name,
            email=str(user_data.email),
        )

        db.add(user)

        await db.commit()
        await db.refresh(user)

        return user

    except HTTPException:
        raise

    except IntegrityError as error:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this Clerk ID or email already exists",
        ) from error

    except SQLAlchemyError as error:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while creating user",
        ) from error