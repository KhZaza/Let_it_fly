import itertools

from fastapi import WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from shapely.geometry import Point
import asyncio
import h3
from fastapi import Depends, HTTPException
from typing import Annotated
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import app, get_db
from app.database import models
from app.routes.user_auth import get_current_active_user
from app.models.user_auth.request_model import User as u
from app.models.position import request_model, return_model
from app.models.driver.return_model import DriverCache
from app.routes.driver import get_driver_status, driver_status
from app.redis import geo_position
from app.mapping import isochrone, navigation, models as map_model

SEARCH_UNIT = "m"
TIME = 30 * 60


def generate_driver_key(data: DriverCache) -> str:
    key = f"DRIVER/{data.car_type}"
    return key


async def get_key(id_str: str, db: Session = Depends(get_db)) -> str:
    """Returns a key to a geospatial collection to look up in

    :param id_str: The user ID
    :type id_str: str
    :param db: _description_, defaults to Depends(get_db)
    :type db: Session, optional
    :return: A string key for redis geospatial query
    :rtype: str
    """
    # select the user driver state from the database
    query = select(models.User.is_driver).where(models.User.user_id == id_str)
    res = await db.execute(query)
    user = res.scalar()
    if user:
        # if user is a driver, retrieve redis data
        data = await get_driver_status(f"DRIVER/{id_str}")
        # generate a key based on car type
        return generate_driver_key(data)
    else:
        # User is a customer
        return "CUSTOMER"


@app.post(
    "/api/position/get",
    summary="Retrieves the position for a given user id",
    tags=["Position Methods"],
)
async def get_position_id(
    item: request_model.GetPositionById,
    db: Session = Depends(get_db),
) -> return_model.ReturnLocationSimple:
    # Retrieve user key
    key = await get_key(item.id, db=db)
    # Query the cache for the position based on id
    pos = await geo_position.get_geo_position(key=key, name=item.id)
    # Raise an exception if position does not exist
    if pos is None:
        raise HTTPException(400, "Position does not exist")

    return return_model.ReturnLocationSimple(long=pos.x, lat=pos.y)


@app.post("/api/position/set", tags=["Position Methods"])
async def set_user_position(
    item: request_model.AddPositionSimple,
    current_user: Annotated[u, Depends(get_current_active_user)],
):  # -> return_model.AddLocation:
    # Perform the add operation
    key = None
    if current_user.is_driver:
        data = await driver_status(current_user=current_user)
        key = generate_driver_key(data)
    else:
        key = "CUSTOMER"
    print(key)
    pos = await geo_position.add_geo_position(
        key=key, name=current_user.user_id, point=Point(item.long, item.lat)
    )
    ret_item = return_model.AddLocation(id=current_user.user_id)
    ret_item.added = pos
    return JSONResponse(content=jsonable_encoder(ret_item))


@app.post("/api/position/delete", tags=["Position Methods"])
async def delete_user_position(
    current_user: Annotated[u, Depends(get_current_active_user)]
):  # -> return_model.AddLocation:
    # Perform the add operation
    key = None
    if current_user.is_driver:
        data = await driver_status(current_user=current_user)
        key = generate_driver_key(data)
    else:
        key = "CUSTOMER"
    print(key)
    pos = await geo_position.remove_geo_position(key=key, name=current_user.user_id)
    return {"result": pos}


@app.post("/api/route/get", tags=["Position Methods"])
async def get_route(
    route: request_model.CreateRoutePosition
) -> map_model.AnnotatedTurn:
    # map GeoJSON points to a list of shapely points
    loc = map(lambda val: Point(val.coordinates[0], val.coordinates[1]), route.steps)
    return navigation.get_directions(loc)


@app.post("/api/position/nearby", tags=["Position Methods"])
async def get_position_nearby(
    item: request_model.GetNearbyPoint
) -> return_model.NearbyPoints:
    # Build the return object
    ret_item = return_model.NearbyPoints(time=TIME)

    # Query the cache for the position
    pos = Point(
        item.searchPoint.coordinates[0], item.searchPoint.coordinates[1]
    )  # await geo_position.get_geo_position(key=item.key, name=item.id)

    # Call the Map API to get the isochrone
    iso = isochrone.get_isochrone(point=pos, time=TIME)

    # Use the isochrone to get attributes for the redis query
    iso_center = iso.centroid  # Get the centroid point of the search bounding box
    # Get the lower and upper bounds of the box
    min_long, min_lat, max_long, max_lat = iso.bounds
    # Calculate the diagonal distance between latitude and longitude points in meters
    dist = h3.point_dist((min_lat, min_long), (max_lat, max_long), unit=SEARCH_UNIT)
    # Halve the diagonal distance to get the search radius
    radius = dist / 2

    # Query the redis database for points in a radius around the center of the bounding box
    pos = await geo_position.get_points(
        key=item.key, point=iso_center, radius=radius, unit=SEARCH_UNIT
    )
    # Assemble the output list
    res = filter(
        # Filter for points inside the isochrone shape and not the original search point
        lambda x: iso.contains(x.to_point()),
        # Map each tuple to a return Location object
        [
            return_model.AnnotatedLocation(
                id=i[0].decode(),
                lat=i[1][1],
                long=i[1][0],
                driverData=await get_driver_status(f"DRIVER/{i[0].decode()}"),
            )
            for i in pos
        ],
    )

    ret_item.points = res
    return ret_item
