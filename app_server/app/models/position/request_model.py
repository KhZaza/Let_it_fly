from pydantic import BaseModel, Field
from typing_extensions import Annotated
from typing import List
from geojson_pydantic import Point

from app.models.manage_car.request_model import CarChoice

class GetPosition(BaseModel):
    id: str = Field(description="The name of the point to search for")
    key: str = Field(
        default="DriverLocation",
        description="The Redis key that the id is located under",
    )

class GetPositionById(BaseModel):
    id: str = Field(description="The name of the point to search for")

class AddPosition(BaseModel):
    id: str
    key: str
    lat: float
    long: float

class AddPositionSimple(BaseModel):
    lat: float
    long: float

class GetNearby(BaseModel):
    id: str
    key: str
    time: int

class GetNearbyPoint(BaseModel):
    searchPoint: Point
    key: str


class CreateRoutePosition(BaseModel):
    steps: List[Point] = Annotated[List[Point], Field(min_length=2)]
