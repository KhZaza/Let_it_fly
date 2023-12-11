from pydantic import BaseModel
from typing import Union, Optional
import enum


class CarChoice(enum.Enum):
    sedan = "SEDAN"
    suv = "SUV"
    cargo = "CARGO"
    def __str__(self):
        return str(self.value)

class CreateCar(BaseModel):
    name: str
    manufacturer: str
    carType: CarChoice


class EditCar(BaseModel):
    carId: Optional[str]
    name: Union[str, None] = None
    manufacturer: Union[str, None] = None
    carType: Union[CarChoice, None] = None
