"""FastAPI application entry point."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

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


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Initialize application resources and clean them up on shutdown."""

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
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
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
    """Return the root API status."""

    return {
        "message": "Backend is running!",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    """Return the API health status."""

    return {
        "status": "OK",
    }