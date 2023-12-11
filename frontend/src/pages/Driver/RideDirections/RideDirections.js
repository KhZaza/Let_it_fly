import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import TurnByTurn from "../../../components/Map/TurnByTurn/TurnByTurn";
import axios from "axios";
import {
  Alert,
  AlertIcon,
  Fade,
} from "@chakra-ui/react";
import RideStatus from "./RideStatus";
import { useAuth } from "../../../features/Authentication/authProvider";
import TrackShareRequest from "./TrackShareRequest";
import { Marker } from "react-map-gl/dist/esm/exports-maplibre";

export default function RideDirections() {
  const { token } = useAuth();
  const { id } = useParams();
  const [route, setRoute] = useState({});
  const [instructions, setInstructions] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState(null);
  const [iten, setIten] = useState([]);

  const getState = async () => {
    // make a call to API to get rides
    try {
      const response = await axios.post(
        "http://localhost:8000/api/driver/status",
        {}
      );
      setIsStarted(response.data.in_ride && response.data.ride_id === id);
    } catch (e) {
      console.error(e);
    }
  };

  const getStatus = async () => {
    // make a call to API to get rides
    try {
      const response = await axios.post(
        "http://localhost:8000/api/ride/driver/status",
        { rideId: id }
      );
      setIsShared(response.data.isShared);
      setIsCompleted(response.data.complete);
    } catch (e) {
      console.error(e);
    }
  };

  const getIten = async () => {
    // make a call to API to get rides
    try {
      const response = await axios.post(
        "http://localhost:8000/api/reservation/itinerary/get",
        { rideId: id }
      );
      setIten(response.data.steps);
    } catch (e) {
      console.error(e);
    }
  };
  const getDirections = async () => {
    // make a call to API to get rides
    try {
      const response = await axios.post(
        "http://localhost:8000/api/reservation/route/get",
        { rideId: id }
      );
      console.log(response.data);
      setRoute(response.data.route);
      setInstructions(response.data.instructions);
      setLoaded(true);
    } catch (e) {
      console.error(e);
    }
  };

  const refresh = async () => {
    await getDirections();
    await getIten();
  };

  useEffect(() => {
    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    getStatus().then(getState().then(getIten()).then(getDirections()));
  }, []);

  if (loaded) {
    return (
      <>
      {error ? (
        <>
          <Fade in={error}>
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          </Fade>
          <br />
        </>
      ) : (
        <></>
      )}
        <TurnByTurn
          routeLayer={route}
          instructions={instructions}
          iten={iten}
          rideId={id}
          isStarted={isStarted}
          setError={setError}
        >
          {!isStarted && !isCompleted ? (
            <RideStatus id={id} setIsStarted={getState} />
          ) : (
            <></>
          )}
          
          {isShared && !isCompleted ? (
            <TrackShareRequest refresh={refresh} />
          ) : (
            <></>
          )}

          {iten.map((e) => (
            <Marker
              latitude={e.coordinates[1]}
              longitude={e.coordinates[0]}
              key={e.properties.passengerId}
              color={e.properties.passengerId ? "red" : "green"}
            />
          ))}
        </TurnByTurn>
      </>
    );
  }
}
