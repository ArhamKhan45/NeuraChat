"""Routes for model configuration."""

from fastapi import (
    APIRouter,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.exc import (
    IntegrityError,
    SQLAlchemyError,
)

from app.features.model_configuration.model import (
    ModelConfiguration,
)
from app.features.model_configuration.schema import (
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


@model_configuration_router.patch(
    "",
    response_model=SaveModelConfigurationResponse,
    status_code=status.HTTP_200_OK,
)
async def save_model_configurations(
    configuration_data: SaveModelConfigurationRequest,
    clerk_id: ProtectedUser,
    db: DatabaseSession,
) -> SaveModelConfigurationResponse:
    """
    Create or update the authenticated user's model configurations.
    """

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
                detail="User not found.",
            )

        chat_result = await db.execute(
            select(ModelConfiguration).where(
                ModelConfiguration.user_id == user.id,
                ModelConfiguration.model_type == "chat",
            )
        )

        chat_configuration = chat_result.scalar_one_or_none()

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
            chat_configuration.provider = configuration_data.chat.provider
            chat_configuration.model_name = (
                configuration_data.chat.model_name
            )
            chat_configuration.api_key = (
                configuration_data.chat.api_key
            )

        agent_configuration: ModelConfiguration | None = None

        if configuration_data.agent is not None:
            agent_result = await db.execute(
                select(ModelConfiguration).where(
                    ModelConfiguration.user_id == user.id,
                    ModelConfiguration.model_type == "agent",
                )
            )

            agent_configuration = (
                agent_result.scalar_one_or_none()
            )

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
        raise

    except IntegrityError as error:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Model configuration already exists.",
        ) from error

    except SQLAlchemyError as error:
        await db.rollback()

        print("DATABASE ERROR:", repr(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while saving model configurations.",
        ) from error