from app.mapping import models
import pydantic 

def test_route(client, routing_client):
    '''
    response = client.post(
        "/api/route/get",
        json={
            "steps": [
                {"type": "Point", "coordinates": [-121.92180613866574, 37.35201175]},
                {"type": "Point", "coordinates": [-121.88122545292521, 37.33519025]},
            ]
        },
    )
    print(response.json())
    assert response.status_code == 200
    try:
        # ensure model doesn't fail with validation error
        assert models.AnnotatedTurn(**response.json())
    except pydantic.ValidationError as exc:
        print(f"ERROR: Invalid schema: {exc}")
'''
