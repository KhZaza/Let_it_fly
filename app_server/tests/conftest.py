from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient
import app
import fakeredis
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.database import utils
from app import mapping
@pytest.fixture
def client():
    """A pytest testing client to make calls to the API"""
    client = TestClient(app.app)
    yield client
@pytest.fixture
async def db():
    eng = create_async_engine('sqlite+aiosqlite:///:memory:')
    await utils.init_db(eng)
    return eng

@pytest.fixture
def empty_routing_client():
    mapping.client = Mock()
    yield mapping.client

@pytest.fixture
def redis():
    r = fakeredis.FakeStrictRedis()
    yield r