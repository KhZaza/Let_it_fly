from app import engine
from app.database import models


async def init_db(engine=engine):
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
