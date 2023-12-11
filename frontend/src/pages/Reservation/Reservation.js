import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Fade,
} from "@chakra-ui/react";
import React, { useState } from "react";
import ReservationStepper from "../../components/ReservationStepper/ReservationStepper";
import LocationSelection from "../../components/LocationSelection/LocationSelection";
import LocationProvider from "../../features/Location/locProvider";
import DetailsStep from "../../components/ReservationStepper/DetailsStep";
import ReviewStep from "../../components/ReservationStepper/ReviewStep";
import DriverStep from "../../components/ReservationStepper/DriverStep";
import { useAuth } from "../../features/Authentication/authProvider";
import axios from "axios";
import { Link } from "react-router-dom";
import WaitingStep from "../../components/ReservationStepper/WaitingStep";

export default function Reservation() {
  const { user } = useAuth();
  const [activeStep, setActiveStep_] = useState(0);
  const [searchResults, setSearchResults] = useState({});
  const [startDate, setStartDate] = useState(new Date());
  const [carType, setCarType] = useState("SEDAN");
  const [rideType, setRideType] = useState("RESERVATION");
  const [isResultsLoaded, setIsResultsLoaded] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [rideId, setRideId] = useState("");
  const [driverResults, setDriverResults] = useState([]);
  const [selectedDriver, setSelectedDriver_] = useState({});
  const [isDriverPicked, setIsDriverPicked] = useState(false);
  // pickup and dropoff
  const [destPoint, setDestPoint] = useState(null);
  const [pickupPoint, setPickupPoint] = useState(null);
  const [error, setError] = useState(null);
  const steps = [
    { title: "Location", description: "Pickup & Destination" },
    { title: "Details", description: "Choose options" },
    { title: "Driver", description: "Available driver" },
    { title: "Review", description: "Review & Submit" },
  ];

  const setSelectedDriver = (e) => {
    setSelectedDriver_(e);
    setIsDriverPicked(true);
  };

  const checkIndex = (step) => {
    // guard step change against invalid input
    if (destPoint === null || pickupPoint === null) {
      setIsDriverPicked(false);
      if (step > 0) {
        setError("You need to specify a pickup and destination!");
      } else {
        setError(null);
      }
      return 0;
    } else if (
      destPoint !== null &&
      pickupPoint !== null &&
      destPoint.geometry.coordinates == pickupPoint.geometry.coordinates
    ) {
      setIsDriverPicked(false);
      if (step > 0) {
        setError("Pickup and destination cannot be the same!");
      } else {
        setError(null);
      }
      return 0;
    } else if (!["SEDAN", "SUV", "CARGO"].includes(carType)) {
      setIsDriverPicked(false);
      if (step > 1) {
        setError("Pick a valid car type!");
      } else {
        setError(null);
      }
      return 1;
    } else if (rideType === "RESERVATION" && startDate < new Date()) {
      setIsDriverPicked(false);
      if (step > 1) {
        setError("Pick a later date!");
      } else {
        setError(null);
      }
      return 1;
    } else if (!isDriverPicked) {
      console.log(selectedDriver);
      console.log(isDriverPicked)
      if (step > 2) {
        setError("Pick a driver");
        console.log("driver not set");
      } else {
        console.log("driver set");
        setError(null);
      }
      return 2;
    } else {
      setIsDriverPicked(false);
      setError(null);
      return 3;
    }
  };

  const setActiveStep = (step) => {
    if (step <= checkIndex(step)) {
      setActiveStep_(step);
    }
  };

  const tabSwitch = (step) => {
    setActiveStep(step);
  };

  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleSubmit = async () => {
    let reservation = {
      destPoint: {
        ...destPoint.geometry,
        properties: {
          address: destPoint.properties.address,
          index: 1,
          passengerId: user.user_id,
        },
      },
      pickupPoint: {
        ...pickupPoint.geometry,
        properties: {
          address: pickupPoint.properties.address,
          index: 1,
          passengerId: user.user_id,
        },
      },
      driverId: selectedDriver.driverId,
      rideType: rideType,
      reservationTime: startDate.toISOString(),
    };
    console.log(reservation);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/reservation/create",
        reservation
      );
      console.log(response);
      if (rideType === "ON_DEMAND_CAR_SHARE" && response.data.waiting) {
        setIsWaiting(true);
      }
      setIsSubmitted(true);
      setRideId(response.data.rideId);
    } catch (err) {
      console.error(err);
      setError(
        err.response.data.detail
      );
    }
  };

  const stepContents = [
    <LocationSelection
      searchResults={searchResults}
      setSearchResults={setSearchResults}
      destPoint={destPoint}
      setDestPoint={setDestPoint}
      pickupPoint={pickupPoint}
      setPickupPoint={setPickupPoint}
      nextStep={nextStep}
    />,
    <DetailsStep
      startDate={startDate}
      setStartDate={setStartDate}
      carType={carType}
      setCarType={setCarType}
      setIsResultsLoaded={setIsResultsLoaded}
      setDriverResults={setDriverResults}
      nextStep={nextStep}
      setRideType={setRideType}
      rideType={rideType}
      destPoint={destPoint}
      pickupPoint={pickupPoint}
    />,
    <DriverStep
      isResultsLoaded={isResultsLoaded}
      driverResults={driverResults}
      setSelectedDriver={setSelectedDriver}
      isDriverPicked={isDriverPicked}
      nextStep={nextStep}
    />,
    <ReviewStep
      destPoint={destPoint}
      pickupPoint={pickupPoint}
      startDate={startDate}
      selectedDriver={selectedDriver}
      handleSubmit={handleSubmit}
      carType={carType}
      rideType={rideType}
    />,
  ];

  if (isWaiting) {
    return <WaitingStep rideId={rideId} />;
  } else if (isSubmitted) {
    return (
      <Alert
        status="success"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="100vh"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Reservation submitted!
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          Your ride has been reserved.
          <br />
          <Link to={"/"}>
            <Button>Go Home</Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

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
      <Box p="4">
        <LocationProvider>
          <Box ml={4} mr={4}>
            <ReservationStepper
              steps={steps}
              activeStep={activeStep}
              tabSwitch={tabSwitch}
            />
          </Box>
          <Box ml={4} mr={4} mt={6}>
            {stepContents[activeStep]}
          </Box>
        </LocationProvider>
      </Box>
    </>
  );
}
