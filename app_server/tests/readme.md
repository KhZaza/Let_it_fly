# Unit testing

## Table of contents

- [Running tests]()
- [Creating tests]()
- [Continuous integration]()

## Running tests

Please make sure pytest and pytest-cov are installed. From the parent directory of tests (app_server), run the tests using `pytest`.
If coverage is needed, run with coverage using `pytest --cov=app`.

```commandline
pytest --cov=app
```

## Creating tests

### Naming tests

In order for the `pytest` command to detect your test, name your test function starting with `test_`.

```python
def test_...():
    ...
```

### Fixtures

Several fixtures are available in conftest.py that are available for use.

- `db` - This returns an async SQLAlchemy engine that references an in-memory SQLite database with all of the tables created. You have to assign the database to `app.engine` before using the engine in code.
- `fakeredis` - This returns a fake redisclient that will allow you to test redis operations.
- `client` - This returns an HTTPX client instance for testing. This will allow you to make calls to API endpoints without spinning up the dev server. 
    - `client.post("/path", json={})` - This will send a POST request to the path with the data. The data is a
      dictionary object that will represent the data sent by the form.
    - `client.get("/path", json={})` - This will send a GET request to the path with the data. The data is a dictionary
      object that will represent the data sent by the form.
    - Set the data received from the request to a variable in order to access the data that Flask returns to the
      request.
        - `response = client.post(...` - Will set the data received from the request to the variable `response`.
        - `response.data` - Will return the contents of the page received from the request (usually the contents of the
          html).
        - `response.status_code` - Will return
          the [HTTP status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) of the response.

In order to use a fixture in a test, pass the name(s) of the fixture into the test function

```python
def test_login(client, db):
    ...
```

Assign fixtures to the global variables to replace them in operation

```python
import app

def test_geospatial(redis):
    app.redis.r = redis
```

If you are using async await calls in tests, mark your function using the decorator
```python
import pytest

@pytest.mark.asyncio
async def test_db(db):
    await db
```

## Continuous Integration
TODO: Integrate tests with Github Actions