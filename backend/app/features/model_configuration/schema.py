"""Pydantic schemas for model configurations."""

from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field


class ModelConfigurationCreate(BaseModel):
    """Input for one model configuration."""

    provider: str = Field(
        min_length=1,
        max_length=100,
    )

    model_name: str = Field(
        min_length=1,
        max_length=255,
    )

    model_url: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    api_key: str = Field(
        min_length=1,
        max_length=1000,
    )


class SaveModelConfigurationRequest(BaseModel):
    """Chat and optional agent configuration."""

    chat: ModelConfigurationCreate
    agent: ModelConfigurationCreate | None = None


class ModelConfigurationResponse(BaseModel):
    """One stored model configuration."""

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: uuid.UUID
    user_id: uuid.UUID
    model_type: str
    provider: str
    model_name: str
    model_url: str | None
    api_key: str
    created_at: datetime
    updated_at: datetime


class GetModelConfigurationResponse(BaseModel):
    """Saved configurations returned to the frontend."""

    chat: ModelConfigurationResponse | None = None
    agent: ModelConfigurationResponse | None = None


class SaveModelConfigurationResponse(BaseModel):
    """Configurations returned after saving."""

    chat: ModelConfigurationResponse
    agent: ModelConfigurationResponse | None = None