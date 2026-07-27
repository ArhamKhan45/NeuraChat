from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.features.user import TokenResponse, UserCreate, UserResponse,UserModel
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select


from sqlalchemy.exc import (
    IntegrityError,
    SQLAlchemyError,
)

from utils.dependency import DatabaseSession




router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/login", response_model=TokenResponse)
async def login_user():
    pass


@router.post("/register",response_model=UserResponse,status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    db: DatabaseSession ) -> UserModel:
    try:
        statement= select(UserModel).where(
            UserModel.email == str(user_data.email)
        )

        result=await db.execute(statement)

        existing_user = result.scalar_one_or_none()

        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists",
            )

        user = UserModel(
                clerk_id=user_data.clerk_id or "user_3GUieW91ZmxFzwGrNDsPvCh5xAb",
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
            detail="A user with this email already exists",
        ) from error

    except SQLAlchemyError as error:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while creating user",
        ) from error

    except Exception as error:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while creating user",
        ) from error