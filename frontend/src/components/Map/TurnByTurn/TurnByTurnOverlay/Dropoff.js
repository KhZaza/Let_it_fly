import axios from "axios";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Card,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { point, distance } from "@turf/turf";
import { useNavigate } from "react-router-dom";

export default function Dropoff({ lat, long, iten, rideId,setError }) {
  const navigate = useNavigate();
  const [recent, setRecent] = useState(0);
  const [isEnd, setIsEnd] = useState(false);
  const [isPickup, setIsPickup] = useState(false);
  const [pickupName, setPickupName] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickedUpUsers, setPickedUpUsers] = useState([]);

  useEffect(() => {
    setIsPickup(false);
    setIsEnd(false);
    let pt = point([long, lat]);
    for (let i = 0; i < iten.length; i++) {
      let dist = distance(pt, iten[i], { units: "miles" });
      console.log(dist);
      if (dist <= 0.25) {
        if (iten[i]["properties"]["passengerId"] === null) {
          setIsEnd(true);
          break;
        } else {
          if (pickedUpUsers.includes(iten[i]["properties"]["passengerId"])) {
            continue;
          }
          setIsPickup(true);
          setPickupName(iten[i]["properties"]["passengerId"]);
          setPickupAddress(iten[i]["properties"]["address"]);
          break;
        }
      }
    }
  }, [lat, long]);
  const endRide = async () => {
    // make a call to API to get rides
    try {
      const response = await axios.post(
        "http://localhost:8000/api/driver/ride/end"
      );
      setRecent(recent + 1);
      setIsEnd(false);
      navigate("/");
    } catch (e) {
      console.error(e);
      setError(e.response.data.detail)
    }
  };

  const sendPickup = async () => {
    // make a call to API to get rides
    try {
      const response = await axios
        .post("http://localhost:8000/api/driver/ride/pickup", {
          rideId: rideId,
          custId: pickupName,
        })
        .then(() => {
          setPickedUpUsers([...pickedUpUsers, pickupName]);
          console.log(pickedUpUsers)
          setRecent(recent + 1);
          setPickupName("");
          setPickupAddress("");
        });
    } catch (e) {
      console.error(e);
    }
    setIsPickup(false);
  };

  if (isEnd) {
    return (
      <Card>
        <Alert status="success">
          <AlertIcon />
          <AlertTitle>Arrived at Location</AlertTitle>
          <AlertDescription>
            <Button onClick={() => endRide()}>End Ride</Button>
          </AlertDescription>
        </Alert>
      </Card>
    );
  } else if (isPickup) {
    return (
      <Card>
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>{pickupAddress}</AlertTitle>
          <AlertDescription>
            <Button onClick={() => sendPickup()}>Pickup Passenger</Button>
          </AlertDescription>
        </Alert>
      </Card>
    );
  }
}
