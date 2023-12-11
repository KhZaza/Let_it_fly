from shapely import geometry
from geojson_pydantic import Feature, FeatureCollection, Point

from app import app
from app.models.location import request_model
from app.mapping import geocode

AIRPORT_LOCATIONS = [
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-121.9293365260259, 37.3633299]},
        "properties": {"address": "San José Mineta International Airport"},
    },
    {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-122.2123989, 37.7131093]},
        "properties": {"address": "Oakland International Airport"},
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [-122.38398938548363, 37.622451999999996],
        },
        "properties": {"address": "San Francisco International Airport"},
    },
]


@app.post("/api/location/search")
async def location_search(query: request_model.LocationSearch) -> FeatureCollection:
    # Instantiate shapely point if user provides a sort key
    sort_key = None
    if query.sort_key is not None:
        sort_key = geometry.Point(
            query.sort_key.coordinates[0], query.sort_key.coordinates[1]
        )
    # retrieve sort results
    results = await geocode.search_address(search_key=query.query, sort_point=sort_key)
    # map sort results to GeoJSON features
    mapped_features = map(
        lambda val: Feature(
            type="Feature",
            geometry=Point(type="Point", coordinates=[val.point.x, val.point.y]),
            properties={"address": val.address},
        ),
        results,
    )
    return FeatureCollection(type="FeatureCollection", features=mapped_features)


@app.post("/api/location/airports")
async def airports() -> FeatureCollection:
    # map sort results to GeoJSON features
    mapped_features = map(lambda val: Feature(type="Feature", geometry=Point(type="Point", coordinates=val["geometry"]["coordinates"]), properties=val["properties"]), AIRPORT_LOCATIONS)
    return FeatureCollection(type="FeatureCollection", features=mapped_features)
