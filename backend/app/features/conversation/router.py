"""
Conversation Routes

Responsible for managing the user's conversation history (sidebar).

Endpoints:
    POST   /conversations
        Create a new conversation.

    GET    /conversations
        Return the authenticated user's recent conversations.

    DELETE /conversations/{conversation_id}
        Delete a conversation and all of its messages.
"""

"""Routes for managing conversations."""

import uuid

from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    Response,
    status,
)
from sqlalchemy import (
    delete,
    select,
)
from sqlalchemy.exc import SQLAlchemyError

from app.features.conversation.model import ConversationModel
from app.features.conversation.schema import (
    ConversationCreate,
    ConversationResponse,
)
from app.features.user.model import UserModel
from app.utils.dependency import (
    DatabaseSession,
    ProtectedUser,
)

conversation_router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"],
)


@conversation_router.post(
    "",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    conversation_data: ConversationCreate,
    clerk_id: ProtectedUser,
    db: DatabaseSession,
) -> ConversationModel:
    """Create a new conversation."""

    try:
        result = await db.execute(
            select(UserModel).where(
                UserModel.clerk_id == clerk_id,
            )
        )

        user = result.scalar_one_or_none()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        conversation = ConversationModel(
            user_id=user.id,
            title=conversation_data.title.strip()
            or "New chat",
        )

        db.add(conversation)

        await db.commit()
        await db.refresh(conversation)

        return conversation

    except HTTPException:
        await db.rollback()
        raise

    except SQLAlchemyError as error:
        await db.rollback()

        print(
            "CREATE CONVERSATION ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation",
        ) from error


@conversation_router.get(
    "",
    response_model=list[ConversationResponse],
    status_code=status.HTTP_200_OK,
)
async def get_conversations(
    clerk_id: ProtectedUser,
    db: DatabaseSession,
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
) -> list[ConversationModel]:
    """Return recent conversations."""

    try:
        result = await db.execute(
            select(UserModel).where(
                UserModel.clerk_id == clerk_id,
            )
        )

        user = result.scalar_one_or_none()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        result = await db.execute(
            select(ConversationModel)
            .where(
                ConversationModel.user_id == user.id,
            )
            .order_by(
                ConversationModel.updated_at.desc(),
            )
            .limit(limit)
        )

        return list(result.scalars().all())

    except HTTPException:
        raise

    except SQLAlchemyError as error:
        print(
            "GET CONVERSATIONS ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load conversations",
        ) from error





@conversation_router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_conversation(
    conversation_id: uuid.UUID,
    clerk_id: ProtectedUser,
    db: DatabaseSession,
) -> Response:
    """Delete a conversation."""

    try:
        result = await db.execute(
            select(UserModel).where(
                UserModel.clerk_id == clerk_id,
            )
        )

        user = result.scalar_one_or_none()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        result = await db.execute(
            delete(ConversationModel)
            .where(
                ConversationModel.id == conversation_id,
                ConversationModel.user_id == user.id,
            )
            .returning(
                ConversationModel.id,
            )
        )

        deleted = result.scalar_one_or_none()

        if deleted is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        await db.commit()

        return Response(
            status_code=status.HTTP_204_NO_CONTENT,
        )

    except HTTPException:
        await db.rollback()
        raise

    except SQLAlchemyError as error:
        await db.rollback()

        print(
            "DELETE CONVERSATION ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation",
        ) from error