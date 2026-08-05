"""FastAPI application entry point."""

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import database_engine
from app.features.conversation import conversation_router
from app.features.messages import chat_message_router
from app.features.model_configuration import model_configuration_router
from app.features.user.router import auth_router
from app.helpers import Base
from app.jobs.health_check import (
    start_health_check_scheduler,
    stop_health_check_scheduler,
)

load_dotenv()


def get_allowed_origins() -> list[str]:
    """Return allowed frontend origins from environment variables."""

    configured_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")

    origins = [
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    ]

    default_origins = [
        "http://localhost:3000",
    ]

    if not origins:
        origins = default_origins

    frontend_url = os.getenv("FRONTEND_URL")

    if frontend_url:
        normalized_frontend_url = frontend_url.strip().rstrip("/")

        if normalized_frontend_url not in origins:
            origins.append(normalized_frontend_url)

    return origins


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Initialize and clean up application resources."""

    async with database_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    start_health_check_scheduler()

    try:
        yield
    finally:
        stop_health_check_scheduler()
        await database_engine.dispose()


app = FastAPI(
    title="NeuroChat API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(model_configuration_router)
app.include_router(chat_message_router)
app.include_router(conversation_router)


@app.get("/")
async def home() -> dict[str, str]:
    """Return the API root status."""

    return {
        "message": "Backend is running!",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    """Return the API health status."""

    return {
        "status": "OK",
    }