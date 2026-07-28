"""FastAPI application entry point."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import database_engine
from app.features.model_configuration import (
    model_configuration_router,
)
from app.features.user.router import auth_router
from app.helpers import Base


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create database tables and dispose the engine on shutdown."""

    async with database_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    yield

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


@app.get("/")
async def health() -> dict[str, str]:
    """Return the API health status."""

    return {
        "message": "Backend is running!",
    }