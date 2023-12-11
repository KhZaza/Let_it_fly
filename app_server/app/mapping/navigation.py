from app.mapping import client, models
from shapely.geometry import Point
from geojson_pydantic import LineString
from typing import List


def get_directions(points: List[Point], profile: str = "driving") -> models.AnnotatedTurn:
    """
    Retrieve a turn by turn direction
    """
    # convert shapely to array
    locations = map(lambda i: [i.x, i.y], points)
    # retrieve directions
    res = client.directions(
        locations=locations,
        profile=profile,
        steps=True,
        geometries="geojson",
        overview="full",
    )
    # map the indexes and turn by turn directions to an array of annotated turns
    pred_idx, cur_idx = 0,0
    step_list = []
    #print(res.raw["routes"][0]["legs"])
    #print(res.geometry)
    for leg in res.raw["routes"][0]["legs"]:
        for step in leg["steps"]:
            step_length = len(step["geometry"]["coordinates"])
            m_type = step["maneuver"]["type"]
            m_mod = (
                step["maneuver"]["modifier"] if "modifier" in step["maneuver"] else ""
            )
            m_name = step["name"]
            m_instruction = (
                step["maneuver"]["instruction"]
                if "instruction" in step["maneuver"]
                else None
            )
            step_pos = step["maneuver"]["location"]
            while cur_idx < len(res.geometry) and res.geometry[cur_idx] != step_pos:
                cur_idx += 1
            step_list.append(
                models.TurnInstruction(
                    type=m_type,
                    modifier=m_mod,
                    name=m_name,
                    instruction=m_instruction,
                    startIndex=pred_idx,
                    endIndex=cur_idx,
                )
            )
            pred_idx = cur_idx
    # create a GeoJSON line string
    route_geojson = LineString(type="LineString", coordinates=res.geometry)
    # return a pydantic object
    return models.AnnotatedTurn(
        route=route_geojson,
        instructions=step_list,
        distance=res.distance,
        duration=res.duration,
    )
