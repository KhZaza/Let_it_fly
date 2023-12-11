from app.redis import r
from shapely.geometry import Polygon, Point


async def add_geo_position(point:Point, key:str, name:str)->bool:
    """Adds or updates a geoposition in the redis table

    :param point: A shapely point with x set to longitude and y set to latitude
    :type point: Point
    :param key: The key to add the position to
    :type key: str
    :param name: The name of the label at the coordinate pair
    :type name: str
    :return: The number of items added
    :rtype: bool
    """
    return await r.geoadd(key, (point.x, point.y, name))

async def get_geo_position(key:str,name:str)->Point:
    """Searches for a point with the name in a given key and returns the 

    :param key: The key that the point is contained in
    :type key: str
    :param name: The name of the key to search for
    :type name: str
    :return: A longitude-latitude tuple
    :rtype: tuple
    """
    pos = await r.geopos(key, name)
    if pos is None or pos[0] is None or len(pos) == 0:
        return None
    else:
        return Point(pos[0][0],pos[0][1])
    

async def remove_geo_position(key:str,name:str) -> int:
    ret_id = await r.zrem(key, name)
    return ret_id

async def get_points_key(key:str,name:str, radius:float, unit:str) -> list:
    """Retrieve a set of points that are within radius of the given key

    :param key: The key that the point is contained in
    :type key: str
    :param name: The name of the key to search around
    :type name: str
    :param radius: The radius around the point to search
    :type radius: float
    :param unit: The unit of the search
    :type unit: str
    :return: List of entries
    :rtype: list
    """
    return await r.geosearch(key,member=name,radius=radius,unit=unit,withcoord=True)

async def get_points(key:str,point:Point, radius:float, unit:str) -> list:
    """_summary_

    :param key: The key that the point is contained in
    :type key: str
    :param point: The point to search around
    :type point: Point
    :param radius: The radius around the point to search
    :type radius: float
    :param unit: The unit of the search
    :type unit: str
    :return: List of entries
    :rtype: list
    """
    return await r.geosearch(key,latitude=point.y,longitude=point.x,radius=radius,unit=unit,withcoord=True)