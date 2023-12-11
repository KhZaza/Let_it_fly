from pydantic import BaseModel, field_validator, ValidationInfo


class ReservationQuery(BaseModel):
    id: str


class ReservationStart(BaseModel):
    rideId: str


class CustomerPickup(BaseModel):
    rideId: str
    custId: str


class CustomerStatus(BaseModel):
    custId: str


class RideReview(BaseModel):
    rideId: str
    stars: int
    reviewText: str

    @field_validator('stars', 'reviewText')
    @classmethod
    def validate_atts(cls, v: str, info: ValidationInfo):
        if info.field_name == "stars":
            if not 1 <= int(v) <= 5:
                raise ValueError(f'{v} is not a valid rating (1-5).')
        elif info.field_name == "reviewText":
            if len(v) == 0:
                raise ValueError(f'Review Text cannot be empty')
        return v

class ReviewIdQuery(BaseModel):
    reviewId: str

class ReviewDriverQuery(BaseModel):
    driverId: str

class RideQuery(BaseModel):
    rideId: str