"""Pydantic schemas for conversations."""

from datetime import datetime
import uuid

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class ConversationCreate(BaseModel):
    """Request schema for creating a conversation."""

    title: str = Field(
        default="New chat",
        min_length=1,
        max_length=255,
    )




class ConversationResponse(BaseModel):
    """Response schema for one conversation."""

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime