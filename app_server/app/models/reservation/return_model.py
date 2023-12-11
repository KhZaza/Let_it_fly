from pydantic import BaseModel
from typing import List, Optional
from app.models.manage_car.request_model import CarChoice
from app.models.reservation import request_model
from datetime import datetime


class CarResponse(BaseModel):
    carId: str
    carName: str
    carManufacturer: str
    carType: CarChoice


class DriverResponse(BaseModel):
    driverId: str
    firstName: str
    lastName: str
    rating: int
    car: CarResponse


class SearchResponse(BaseModel):
    results: List[DriverResponse]


class ReservationCreationResponse(BaseModel):
    success: bool = False
    rideId: Optional[str]
    waiting: bool = False


class SharedReservationCreationResponse(ReservationCreationResponse):
    waiting: bool = True


class ReservationIten(BaseModel):
    steps: List[request_model.AnnotatedPoint]


class ReservationPrice(BaseModel):
    price: float
    rate: float
    distance: float
    duration: float


class RideDetails(BaseModel):
    rideId: str
    driverId: str
    scheduleTime: datetime
    rideType: request_model.ReservationChoice
    passengerIds: List[str]


class ShareRequest(BaseModel):
    rideId: str
    locationId: str
    passengerId: str
    dist: float
    price: float
    duration: float


class ShareAccepted(BaseModel):
    accepted: bool = False
    passengerId: str
