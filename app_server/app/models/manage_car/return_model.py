from pydantic import BaseModel
from typing import Union
import enum


class CarChoice(enum.Enum):
    sedan = "SEDAN"
    suv = "SUV"
    cargo = "CARGO"


class CarResponse(BaseModel):
    car_id: Union[str, None] = None
    errorMessage: Union[str, None] = None


class RetrieveCarResponse(BaseModel):
    car_id: Union[str, None] = None
    car_name: Union[str, None] = None
    car_manufacturer: Union[str, None] = None
    car_type: Union[CarChoice, None] = None
