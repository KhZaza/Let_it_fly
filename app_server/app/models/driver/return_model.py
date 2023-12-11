from datetime import time, datetime
from pydantic import BaseModel
from typing import Union, List
from app.models.driver.request_model import DayChoice
from app.models.reservation.request_model import ReservationChoice


class EditScheduleResponse(BaseModel):
    success: bool = False
    errorMessage: Union[str, None] = None


class ScheduleObject(BaseModel):
    id: str
    dayOfWeek: DayChoice
    startTime: time
    endTime: time


class ScheduleResponse(BaseModel):
    driverId: str
    schedule: List[ScheduleObject]


class RideLocation(BaseModel):
    name: str
    order: int


class ReservationResponse(BaseModel):
    rideId: str
    # rideType: ReservationChoice
    reservationTime: datetime
    address: str
    price: float


class TotalSchedule(BaseModel):
    rides: List[ReservationResponse]


class ReturnStatus(BaseModel):
    success: bool


class DriverCache(BaseModel):
    car_id: str
    car_type: str
    in_ride: bool = False
    ride_id: str = ""
    ride_passengers: int = 0
    share_enabled: bool = False
    dest_lat: float = 0
    dest_long: float = 0
