"""Routes for reading and saving model configurations."""

from fastapi import (
    APIRouter,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.features.model_configuration.model import ModelConfiguration
from app.features.model_configuration.schema import (
    GetModelConfigurationResponse,
    SaveModelConfigurationRequest,
    SaveModelConfigurationResponse,
)
from app.features.user.model import UserModel
from app.utils.dependency import (
    DatabaseSession,
    ProtectedUser,
)


model_configuration_router = APIRouter(
    prefix="/model-configurations",
    tags=["Model Configurations"],
)


async def get_authenticated_user(
    clerk_id: str,
    db: DatabaseSession,
) -> UserModel:
    """Return the authenticated database user."""

    result = await db.execute(
        select(UserModel).where(
            UserModel.clerk_id == clerk_id,
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User does not exist in the database",
        )

    return user


@model_configuration_router.get(
    "",
    response_model=GetModelConfigurationResponse,
    status_code=status.HTTP_200_OK,
)
async def get_model_configurations(
    clerk_id: ProtectedUser,
    db: DatabaseSession,
) -> GetModelConfigurationResponse:
    """Return the authenticated user's saved model configurations."""

    try:
        user = await get_authenticated_user(
            clerk_id=clerk_id,
            db=db,
        )

        result = await db.execute(
            select(ModelConfiguration).where(
                ModelConfiguration.user_id == user.id,
            )
        )

        configurations = result.scalars().all()

        chat_configuration = next(
            (
                configuration
                for configuration in configurations
                if configuration.model_type == "chat"
            ),
            None,
        )

        agent_configuration = next(
            (
                configuration
                for configuration in configurations
                if configuration.model_type == "agent"
            ),
            None,
        )

        return GetModelConfigurationResponse(
            chat=chat_configuration,
            agent=agent_configuration,
        )

    except HTTPException:
        raise

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load model configurations",
        ) from error


@model_configuration_router.put(
    "",
    response_model=SaveModelConfigurationResponse,
    status_code=status.HTTP_200_OK,
)
async def save_model_configurations(
    configuration_data: SaveModelConfigurationRequest,
    clerk_id: ProtectedUser,
    db: DatabaseSession,
) -> SaveModelConfigurationResponse:
    """Create or replace the authenticated user's configurations."""

    try:
        user = await get_authenticated_user(
            clerk_id=clerk_id,
            db=db,
        )

        result = await db.execute(
            select(ModelConfiguration).where(
                ModelConfiguration.user_id == user.id,
            )
        )

        configurations = result.scalars().all()

        chat_configuration = next(
            (
                configuration
                for configuration in configurations
                if configuration.model_type == "chat"
            ),
            None,
        )

        if chat_configuration is None:
            chat_configuration = ModelConfiguration(
                user_id=user.id,
                model_type="chat",
                provider=configuration_data.chat.provider,
                model_name=configuration_data.chat.model_name,
                api_key=configuration_data.chat.api_key,
            )

            db.add(chat_configuration)

        else:
            chat_configuration.provider = (
                configuration_data.chat.provider
            )
            chat_configuration.model_name = (
                configuration_data.chat.model_name
            )
            chat_configuration.api_key = (
                configuration_data.chat.api_key
            )

        agent_configuration = next(
            (
                configuration
                for configuration in configurations
                if configuration.model_type == "agent"
            ),
            None,
        )

        if configuration_data.agent is not None:
            if agent_configuration is None:
                agent_configuration = ModelConfiguration(
                    user_id=user.id,
                    model_type="agent",
                    provider=configuration_data.agent.provider,
                    model_name=configuration_data.agent.model_name,
                    api_key=configuration_data.agent.api_key,
                )

                db.add(agent_configuration)

            else:
                agent_configuration.provider = (
                    configuration_data.agent.provider
                )
                agent_configuration.model_name = (
                    configuration_data.agent.model_name
                )
                agent_configuration.api_key = (
                    configuration_data.agent.api_key
                )

        await db.commit()
        await db.refresh(chat_configuration)

        if agent_configuration is not None:
            await db.refresh(agent_configuration)

        return SaveModelConfigurationResponse(
            chat=chat_configuration,
            agent=agent_configuration,
        )

    except HTTPException:
        await db.rollback()
        raise

    except SQLAlchemyError as error:
        await db.rollback()

        print(
            "MODEL CONFIGURATION ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save model configurations",
        ) from error