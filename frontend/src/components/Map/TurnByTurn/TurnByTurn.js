import { Layer, Marker, Source } from "react-map-gl/maplibre";
import MapContainer from "../Map";
import React, { useEffect, useState } from "react";
import { Box, VStack } from "@chakra-ui/react";
import TurnByTurnOverlay from "./TurnByTurnOverlay/TurnByTurnOverlay";
import { nearestPointOnLine, point } from "@turf/turf";
import axios from "axios";
import Dropoff from "./TurnByTurnOverlay/Dropoff";
import { useAuth } from "../../../features/Authentication/authProvider";

export default function TurnByTurn({
  routeLayer,
  instructions,
  children,
  iten,
  rideId,
  isStarted,
  setError
}) {
  const { token, user } = useAuth();
  const [lat, setLat] = useState(0);
  const [long, setLong] = useState(0);
  const [markerVal, setMarkerVal] = useState([0, 0]);
  const [instructionIndex, setInstIdx] = useState(0);
  let zoom = 17;
  const [firstRender, setFirstRender] = useState(false);
  //const mapHeight = useBreakpointValue({base: "50vh", sm: '50vh', lg: "77vh"}, {ssr: false});
  const updatePoint = async (long, lat) => {
    setMarkerVal([long, lat]);
    let pt = point([long, lat]);
    let searchVal = nearestPointOnLine(routeLayer, pt, { units: "miles" });
    console.log(searchVal);
    setInstIdx(searchVal.properties.index);
    // send to server
    try {
      const response = await axios.post(
        "http://localhost:8000/api/position/set",
        {
          lat: lat,
          long: long,
        }
      );
    } catch (e) {
      console.error(e);
    }
  };
  const getLocationPosition = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      updatePoint(position.coords.longitude, position.coords.latitude).then(
        () => {
          setLat(position.coords.latitude);
          setLong(position.coords.longitude);
        }
      );
    });
  };

  const getPosition = async () => {
    // try to retrieve location from server
    try {
      const response = await axios.post(
        "http://localhost:8000/api/position/get",
        { id: user.user_id }
      );
      console.log("Position data retrieved", response.data);
      setMarkerVal([response.data.long, response.data.lat]);
      setLat(response.data.lat);
      setLong(response.data.long);
    } catch (error) {
      // no location on server, retrieve from browser
      console.error(error);
      getLocationPosition();
    }
  };

  useEffect(() => {
    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    if (!firstRender) {
      getPosition().then(setFirstRender(true));
    }
  }, [firstRender]);

  if (firstRender) {
    return (
      <MapContainer lat={lat} lng={long} zoom={zoom} height={"100vh"}>
        <Box maxW="sm" m={2}>
          <VStack align="left">
            <TurnByTurnOverlay
              curPos={false}
              route={routeLayer}
              index={instructionIndex}
              instructions={instructions}
            />
            {isStarted ? (
              <Dropoff
                lat={markerVal[1]}
                long={markerVal[0]}
                iten={iten}
                rideId={rideId}
                setError={setError}
              />
            ) : (
              <></>
            )}

            {children}
          </VStack>
        </Box>

        {routeLayer ? (
          <Source id="polylineLayer" type="geojson" data={routeLayer}>
            <Layer
              id="lineLayer"
              type="line"
              layout={{
                "line-join": "round",
                "line-cap": "round",
              }}
              paint={{
                "line-color": "rgba(3, 170, 238, 0.5)",
                "line-width": 5,
              }}
            />
          </Source>
        ) : (
          <></>
        )}
        <Marker
          latitude={markerVal[1]}
          longitude={markerVal[0]}
          draggable={true}
          anchor="bottom"
          onDragEnd={(e) => updatePoint(e.lngLat.lng, e.lngLat.lat)}
        />
      </MapContainer>
    );
  }
}
