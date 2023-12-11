from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
import os

DB_DRIVER = os.getenv("DB_DRIVER", default="postgresql+asyncpg")
DB_HOST = os.getenv("DB_HOST", default="localhost")
DB_USER = os.getenv("DB_USER", default="postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", default="postgres")
DB_NAME = os.getenv("DB_NAME", default="postgres")

engine = create_async_engine(
    f"{DB_DRIVER}://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}",
    echo=True,
)

SessionLocal = async_sessionmaker(engine)


async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()


app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes import position, user_auth, manage_car, location, driver, reservation, ride
