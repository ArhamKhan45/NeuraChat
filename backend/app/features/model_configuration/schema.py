"""Pydantic schemas for model configuration."""

from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict


class ModelConfigurationCreate(BaseModel):
    """Request schema for a single model configuration."""

    provider: str
    model_name: str
    api_key: str


class SaveModelConfigurationRequest(BaseModel):
    """Request schema for saving chat and agent configurations."""

    chat: ModelConfigurationCreate
    agent: ModelConfigurationCreate | None = None


class ModelConfigurationResponse(BaseModel):
    """Response schema for a single model configuration."""

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: uuid.UUID
    user_id: uuid.UUID
    model_type: str
    provider: str
    model_name: str
    api_key: str
    created_at: datetime
    updated_at: datetime


class SaveModelConfigurationResponse(BaseModel):
    """Response schema containing chat and agent configurations."""

    chat: ModelConfigurationResponse
    agent: ModelConfigurationResponse | None = None