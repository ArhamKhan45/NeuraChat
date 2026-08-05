"""Pydantic schemas for chat messages."""

from datetime import datetime
from typing import Literal
import uuid

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


MessageRole = Literal[
    "user",
    "assistant",
]


class SendMessageRequest(BaseModel):
    """Request body for sending a conversation message."""

    content: str = Field(
        min_length=1,
        max_length=50_000,
    )


class ChatMessageResponse(BaseModel):
    """Response schema for one chat message."""

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: uuid.UUID
    conversation_id: uuid.UUID
    user_id: uuid.UUID
    role: MessageRole
    content: str
    created_at: datetime
    updated_at: datetime


class SendMessageResponse(BaseModel):
    """Response containing the user message and assistant reply."""

    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse