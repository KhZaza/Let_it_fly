from pydantic import BaseModel
from typing import List, Optional

class PassengerDetails(BaseModel):
    rideId: str
    pickedUp: bool = False

class ReviewReturn(BaseModel):
    reviewId: str

class RideReview(BaseModel):
    driverName: str
    driverId: str
    reviewStars: int
    reviewBody: str

class ReviewList(BaseModel):
    reviews: List[RideReview]
    reviewAvg: int

class CustomerRideState(BaseModel):
    started: bool = False
    complete: bool = False
    reviewCreated: bool = False
    reviewId: Optional[str] = None

class DriverRideState(BaseModel):
    complete: bool = False
    isShared: bool = False