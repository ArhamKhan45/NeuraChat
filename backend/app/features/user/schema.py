from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


class UserCreate(BaseModel):
    """Schema used when creating a new user."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        populate_by_name=True,
    )

    clerk_id: str = Field(
        alias="id",
        min_length=1,
        max_length=255,
    )

    name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        """Ensure the user's name contains meaningful characters."""

        if not value:
            raise ValueError("Name cannot be empty.")

        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        """Convert the email address to lowercase."""

        return str(value).lower()


class UserResponse(BaseModel):
    """Schema returned when sending user data to the client."""

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    clerk_id: str
    name: str
    email: EmailStr
    created_at: datetime
    updated_at: datetime

class TokenResponse(BaseModel):
    """
    Schema returned after successful authentication.

    Attributes:
        access_token: JWT access token used to authenticate
            subsequent API requests.
        token_type: Type of the authentication token
            (typically "Bearer").
    """

    access_token: str
    token_type: str