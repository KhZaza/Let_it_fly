from app.models.manage_car.request_model import CarChoice
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import enum
from geojson_pydantic import Point


class ReservationChoice(enum.Enum):
    on_demand = "ON_DEMAND"
    reservation = "RESERVATION"
    on_demand_car_share = "ON_DEMAND_CAR_SHARE"

    def __str__(self):
        return str(self.value)


class AnnotatedProperties(BaseModel):
    address: str
    index: int
    passengerId: Optional[str]


class AnnotatedPoint(Point):
    properties: AnnotatedProperties

class ReservationQuery(BaseModel):
    carType: CarChoice
    reservationTime: datetime
    rideType: ReservationChoice
    destPoint: AnnotatedPoint
    pickupPoint: AnnotatedPoint

class CreateReservation(BaseModel):
    destPoint: AnnotatedPoint
    pickupPoint: AnnotatedPoint
    driverId: str
    rideType: ReservationChoice
    reservationTime: Optional[datetime]

class CreateReservationTwoPosition(BaseModel):
    toPosition: AnnotatedPoint
    fromPosition: AnnotatedPoint
    #route: List[AnnotatedPoint]
    driverId: str
    rideType: ReservationChoice
    reservationTime: Optional[datetime]

class GetItinerary(BaseModel):
    rideId: str


class GetReservationPrice(BaseModel):
    carType: CarChoice
    rideType: ReservationChoice
    destPoint: AnnotatedPoint
    pickupPoint: AnnotatedPoint
