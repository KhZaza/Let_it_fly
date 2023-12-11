from pydantic import BaseModel, Field
from geojson_pydantic import Point
from typing import Union

class LocationSearch(BaseModel):
    query: str = Field(description="The name of the point to search for")
    sort_key: Union[Point, None] = Field(default=None, description="The current position that you want to sort the results by")