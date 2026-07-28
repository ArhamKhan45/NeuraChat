import os
from collections.abc import AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import ( 
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)

load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")


# Create an asynchronous engine that connects to the PostgreSQL database,
# prints SQL queries for debugging, and automatically checks
# if database connections are still alive before using them.

# echo=True, to get detailed SQL query logs for debugging purposes

database_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True
)


# Create a factory that makes asynchronous database sessions using the engine, 
# and keep objects usable in memory after commit()
# instead of forcing SQLAlchemy to reload them from the database.




async_session_factory = async_sessionmaker(
    bind=database_engine, 
    class_=AsyncSession,
    expire_on_commit=False
) 


# Create a new database session for each request, give it to the API endpoint, automatically
# close it afterward, and if any database operation fails, undo the uncommitted changes (rollback)
# and re-raise the error. 


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise