"""
This file initializes the tables in the database
"""
import asyncio
from app import engine
from app.database import utils


async def main():
    await utils.init_db()

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
