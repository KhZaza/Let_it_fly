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
from app.models.driver.request_model import RetrieveSchedule
from app.routes.driver import driver_status, driver_status_key
from app.redis import geo_position
from app.mapping import isochrone, navigation, models as map_model
from geojson_pydantic import Point as RetPoint



@app.post('/position/get', summary="Retrieves the position for a given id within a key", tags=["Position Methods"])
async def get_position(item: request_model.GetPosition) -> return_model.ReturnLocation:
    """Depreciated"""
    # Build the return object
    ret_item = return_model.ReturnLocation(id=item.id)
    # Query the cache for the position
    pos = await geo_position.get_geo_position(key=item.key, name=item.id)
    # Update the return object on successful return
    if pos is not None:
        ret_item.long = pos.x
        ret_item.lat = pos.y
        ret_item.success = True
    return JSONResponse(content=jsonable_encoder(ret_item))



@app.websocket("/position/get/ws")
async def stream_get_position(websocket: WebSocket):
    """depreciated"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            # Build the return object
            ret_item = return_model.ReturnLocation(id=data['id'])
            # Query the cache for the position
            pos = await geo_position.get_geo_position(key=data['key'], name=data['id'])
            # Update the return object on successful return
            if pos is not None:
                ret_item.long = pos.x
                ret_item.lat = pos.y
                ret_item.success = True
            await websocket.send_json(jsonable_encoder(ret_item))
    except WebSocketDisconnect:
        pass



@app.post('/position/set', tags=["Position Methods"])
async def set_position(item: request_model.AddPosition) -> return_model.AddLocation:
    """Depreciated"""
    # Build the return object
    ret_item = return_model.AddLocation(id=item.id)
    # Perform the add operation
    pos = await geo_position.add_geo_position(key=item.key, name=item.id, point=Point(item.long, item.lat))
    ret_item.added = pos
    return JSONResponse(content=jsonable_encoder(ret_item))


@app.websocket("/position/set/ws")
async def stream_set_position(websocket: WebSocket):
    """Depreciated"""
    await websocket.accept()
    key, name = None, None
    try:
        while True:
            data = await websocket.receive_json()
            ret_item = return_model.AddLocation(id=data['id'])
            key, name = data['key'], data['id']
            pos = await geo_position.add_geo_position(key=data['key'], name=data['id'],
                                                      point=Point(data['long'], data['lat']))
            ret_item.added = pos
            await websocket.send_json(jsonable_encoder(ret_item))
    except WebSocketDisconnect:
        # handle disconnected clients
        if key is not None and name is not None:
            geo_position.remove_geo_position(key=key, name=name)


@app.post('/position/nearby', tags=["Position Methods"])
async def get_position_nearby(item: request_model.GetNearby) -> return_model.NearbyPoints:
    """Depreciated"""
    SEARCH_UNIT = 'm'
    # Build the return object
    ret_item = return_model.NearbyPoints(time=item.time)

    # Query the database for the position
    pos = await geo_position.get_geo_position(key=item.key, name=item.id)
    ret_item.get = return_model.Location(id=item.id, long=pos.x, lat=pos.y)

    # Call the Map API to get the isochrone
    iso = isochrone.get_isochrone(point=pos, time=item.time)

    # Use the isochrone to get attributes for the redis query
    iso_center = iso.centroid  # Get the centroid point of the search bounding box
    # Get the lower and upper bounds of the box
    min_long, min_lat, max_long, max_lat = iso.bounds
    # Calculate the diagonal distance between latitude and longitude points in meters
    dist = h3.point_dist((min_lat, min_long), (max_lat, max_long), unit=SEARCH_UNIT)
    # Halve the diagonal distance to get the search radius
    radius = dist / 2

    # Query the redis database for points in a radius around the center of the bounding box
    pos = await geo_position.get_points(key=item.key, point=iso_center, radius=radius, unit=SEARCH_UNIT)
    # Assemble the output list
    res = filter(
        # Filter for points inside the isochrone shape and not the original search point
        lambda x: iso.contains(x.to_point()) and x.id != item.id,
        # Map each tuple to a return Location object
        map(
            lambda i: return_model.Location(id=i[0].decode(), lat=i[1][1], long=i[1][0]),
            pos
        )
    )
    ret_item.points = res
    return JSONResponse(content=jsonable_encoder(ret_item))