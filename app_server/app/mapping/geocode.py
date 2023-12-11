from typing import Union
from shapely.geometry import Point

from app.mapping import get_geocoder_class, get_geocoder_options

class GeocodedPoint():
    """Encodes an address and shapely point as an intermediate"""
    address: str
    point: Point
    def __init__(self, address, point):
        self.address = address
        self.point = point

    def __str__(self) -> str:
        return f"{self.address} ({self.point})"

    def __repr__(self) -> str:
        return str(self)

async def search_address(search_key: str, sort_point: Union[Point, None]=None) -> GeocodedPoint:
    """This function geocodes the input search_key and returns a list if points sorted by sort_point if provided

    :param search_key: The address to geocode
    :type search_key: str
    :param sort_point: A shapely point to order the results by, defaults to None
    :type sort_point: Union[Point, None], optional
    :return: A list of points that match the geocode for the search key
    :rtype: GeocodedPoint
    """
    cls = get_geocoder_class()
    options = get_geocoder_options()
    async with cls(**options) as geocoder:
        res = await geocoder.geocode(search_key, exactly_one=False, timeout=100)
        if res is None:
            return []
        mapped_output = map(lambda val: GeocodedPoint(address=val.address, point=Point(val.longitude,val.latitude)), res)
        if sort_point is None:
            return mapped_output
        else:
            return sorted(mapped_output, key=lambda x: sort_point.distance(x.point))