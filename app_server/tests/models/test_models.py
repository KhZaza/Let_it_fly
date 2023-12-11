import app
import pytest

@pytest.mark.asyncio
async def test_db(db):
    app.engine = await db
    assert 'sqlite' in app.engine.name
    assert 'postgres' not in app.engine.name