from pydantic import BaseModel
from typing import List, Optional
from geojson_pydantic import LineString


class TurnInstruction(BaseModel):
    type: str
    modifier: str
    name: str
    instruction: Optional[str] = None
    startIndex: int
    endIndex: int


class AnnotatedTurn(BaseModel):
    route: LineString
    instructions: List[TurnInstruction]
    distance: float
    duration: float
