from datetime import datetime, time
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Float,
    DateTime,
    Time,
    Uuid,
    Boolean,
    Enum,
    MetaData,
    Text,
    UniqueConstraint,
    TIMESTAMP
)
import enum
from uuid import uuid4

Base = declarative_base()
metadata_obj = MetaData()


class CarEnum(enum.Enum):
    sedan = 1
    suv = 2
    cargo = 3


class ReservationEnum(enum.Enum):
    on_demand = 1
    reservation = 2
    shared = 3


class User(Base):
    __tablename__ = "users"
    user_id: str = Column(Uuid, primary_key=True, default=uuid4)
    email: str = Column(String, unique=True, nullable=False)
    password_hash: str = Column(String, nullable=False)
    is_driver: bool = Column(Boolean, nullable=False)
    first_name: str = Column(String, nullable=False)
    last_name: str = Column(String, nullable=False)

    schedule = relationship("Schedule")


class RidePassenger(Base):
    __tablename__ = "ride_passengers"
    ride_pass_id: str = Column(Uuid, primary_key=True, default=uuid4)
    ride_id: str = Column(ForeignKey("rides.ride_id"))
    passenger_id: str = Column(ForeignKey("users.user_id"))
    pickup_location_id: str = Column(ForeignKey("locations.location_id"))
    ride_dist: float = Column(Float, nullable=False)
    ride_cost: float = Column(Float, nullable=False)
    location = relationship("Location")


class Car(Base):
    __tablename__ = "cars"
    car_id: str = Column(Uuid, primary_key=True, default=uuid4)
    driver_id: str = Column(ForeignKey("users.user_id"), unique=True)
    car_name: str = Column(String, nullable=False)
    car_manufactuer: str = Column(String, nullable=False)
    car_type: CarEnum = Column(Enum(CarEnum), nullable=False)
    __table_args__ = (
        UniqueConstraint("driver_id", name="one_car_per_driver"),
    )


class Ride(Base):
    __tablename__ = "rides"
    ride_id: str = Column(Uuid, primary_key=True, default=uuid4)
    driver_id: str = Column(ForeignKey("users.user_id"))
    created_at: datetime = Column(TIMESTAMP(timezone=True), nullable=True)
    schedule_time: datetime = Column(TIMESTAMP(timezone=True), nullable=True)
    finish_time: datetime = Column(TIMESTAMP(timezone=True), nullable=True)
    dropoff_location_id: str = Column(ForeignKey("locations.location_id"))
    is_complete: bool = Column(Boolean, nullable=False)
    ride_type: ReservationEnum = Column(Enum(ReservationEnum), nullable=False)
    passengers = relationship("RidePassenger")


class Location(AsyncAttrs, Base):
    __tablename__ = "locations"
    location_id: str = Column(Uuid, primary_key=True, default=uuid4)
    lat: float = Column(Float, nullable=False)
    long: float = Column(Float, nullable=False)
    address: str = Column(String)
    location_index: int = Column(Integer, nullable=False)


class RideReview(Base):
    __tablename__ = "ride_reviews"
    review_id: str = Column(Uuid, primary_key=True, default=uuid4)
    ride_id: str = Column(ForeignKey("rides.ride_id"))
    driver_id: str = Column(ForeignKey("users.user_id"))
    passenger_id: str = Column(ForeignKey("users.user_id"))
    review_stars: int = Column(Integer)
    review_body: str = Column(Text)
    __table_args__ = (
        UniqueConstraint("ride_id", "passenger_id", name="one_per_passenger"),
    )


class Schedule(Base):
    __tablename__ = "schedules"
    id: str = Column(Uuid, primary_key=True, default=uuid4)
    driver_id: str = Column(ForeignKey("users.user_id"))
    day_of_week: int = Column(Integer, nullable=False)
    start_time: time = Column(Time, nullable=False)
    end_time: time = Column(Time, nullable=False)
