from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import database_engine
from app.features.user.model import UserModel
from app.features.user.router import auth_router
from app.helpers import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Create all database tables when the application starts.
    """

    async with database_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    yield

    await database_engine.dispose()


app = FastAPI(
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


@app.get("/")
def health():
    return {
        "message": "Backend is running!",
    }