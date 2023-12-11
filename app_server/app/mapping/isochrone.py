from app.mapping import client
from shapely.geometry import Polygon, Point

def get_isochrone(point:Point, time:int=30, profile:str='auto') -> Polygon:
    """Returns a shapely polygon representing an isochrone

    :param point: _description_
    :type point: Point
    :param time: _description_
    :type time: int
    :param profile: _description_, defaults to 'auto'
    :type profile: str, optional
    :return: _description_
    :rtype: Polygon
    """
    long, lat = point.x, point.y
    isochrones = client.isochrones(locations=[long, lat], profile='driving', intervals=[time])
    iso = isochrones[0]
    geo = Polygon(iso.geometry)
    return geo