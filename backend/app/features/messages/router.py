"""
Message Routes

Responsible for managing messages inside a conversation.

Endpoints:
    GET    /conversations/{conversation_id}/messages
        Return all messages for a conversation.

    POST   /conversations/{conversation_id}/messages
        Save the user's message, generate the AI response,
        save the assistant message, and return both.
"""

"""Routes for sending and reading chat messages."""

import uuid

from fastapi import (
    APIRouter,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.features.messages.model import ChatMessageModel
from app.features.messages.schema import (
    ChatMessageResponse,
    SendMessageRequest,
    SendMessageResponse,
)
from app.features.messages.service import (
    generate_assistant_reply,
)
from app.features.conversation.model import ConversationModel
from app.features.user.model import UserModel
from app.utils.dependency import (
    DatabaseSession,
    ProtectedUser,
)


chat_message_router = APIRouter(
    prefix="/conversations",
    tags=["Chat Messages"],
)


async def get_user_conversation(
    conversation_id: uuid.UUID,
    clerk_id: str,
    db: DatabaseSession,
) -> ConversationModel:
    """Return the authenticated user's conversation."""

    result = await db.execute(
        select(ConversationModel)
        .join(
            UserModel,
            ConversationModel.user_id == UserModel.id,
        )
        .where(
            ConversationModel.id == conversation_id,
            UserModel.clerk_id == clerk_id,
        )
    )

    conversation = result.scalar_one_or_none()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation was not found",
        )

    return conversation


@chat_message_router.get(
    "/{conversation_id}/messages",
    response_model=list[ChatMessageResponse],
    status_code=status.HTTP_200_OK,
)
async def get_conversation_messages(
    conversation_id: uuid.UUID,
    clerk_id: ProtectedUser,
    db: DatabaseSession,
) -> list[ChatMessageModel]:
    """Return all messages from one conversation."""

    try:
        conversation = await get_user_conversation(
            conversation_id=conversation_id,
            clerk_id=clerk_id,
            db=db,
        )

        result = await db.execute(
            select(ChatMessageModel)
            .where(
                ChatMessageModel.conversation_id
                == conversation.id,
            )
            .order_by(
                ChatMessageModel.created_at.asc(),
            )
        )

        return list(result.scalars().all())

    except HTTPException:
        raise

    except SQLAlchemyError as error:
        print(
            "GET CHAT MESSAGES ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load conversation messages",
        ) from error


@chat_message_router.post(
    "/{conversation_id}/messages",
    response_model=SendMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_conversation_message(
    conversation_id: uuid.UUID,
    message_data: SendMessageRequest,
    clerk_id: ProtectedUser,
    db: DatabaseSession,
) -> SendMessageResponse:
    """Save a user message and its assistant reply."""

    try:
        conversation = await get_user_conversation(
            conversation_id=conversation_id,
            clerk_id=clerk_id,
            db=db,
        )

        content = message_data.content.strip()

        user_message = ChatMessageModel(
            conversation_id=conversation.id,
            user_id=conversation.user_id,
            role="user",
            content=content,
        )

        db.add(user_message)

        assistant_content = await generate_assistant_reply(
            message=content,
        )

        assistant_message = ChatMessageModel(
            conversation_id=conversation.id,
            user_id=conversation.user_id,
            role="assistant",
            content=assistant_content,
        )

        db.add(assistant_message)

        await db.commit()

        await db.refresh(user_message)
        await db.refresh(assistant_message)

        return SendMessageResponse(
            user_message=user_message,
            assistant_message=assistant_message,
        )

    except HTTPException:
        await db.rollback()
        raise

    except SQLAlchemyError as error:
        await db.rollback()

        print(
            "CHAT MESSAGE DATABASE ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save chat messages",
        ) from error

    except Exception as error:
        await db.rollback()

        print(
            "ASSISTANT RESPONSE ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate assistant response",
        ) from error