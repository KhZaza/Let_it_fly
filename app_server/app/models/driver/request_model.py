import datetime
from datetime import time
from pydantic import BaseModel
from typing import Optional, Union
import enum


class DayChoice(enum.Enum):
    sun = "SUNDAY"
    mon = "MONDAY"
    tues = "TUESDAY"
    wed = "WEDNESDAY"
    thurs = "THURSDAY"
    fri = "FRIDAY"
    sat = "SATURDAY"


class EditSchedule(BaseModel):
    scheduleId: Optional[str] = None
    day: DayChoice
    startTime: time
    endTime: time


class RetrieveSchedule(BaseModel):
    driverId: str

class RetrieveReservations(BaseModel):
    date: Union[datetime.date, None] = None

class DeleteSchedule(BaseModel):
    blockId: str