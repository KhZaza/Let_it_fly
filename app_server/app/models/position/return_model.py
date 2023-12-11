from typing import Union
from pydantic import BaseModel, Field
from shapely import Point

from app.models.driver.return_model import DriverCache


class ReturnLocation(BaseModel):
    id: str
    lat: Union[float, None] = None
    long: Union[float, None] = None
    success: bool = False


class ReturnLocationSimple(BaseModel):
    lat: Union[float, None] = None
    long: Union[float, None] = None


class AddLocation(BaseModel):
    id: str
    added: int = 0


class Location(BaseModel):
    id: Union[str, None] = None
    lat: float
    long: float

    def to_point(self) -> Point:
        return Point(self.long, self.lat)


class AnnotatedLocation(Location):
    driverData: DriverCache


class NearbyPoints(BaseModel):
    get: Union[Location, None] = None
    time: int = 0
    points: list[Location] = []
