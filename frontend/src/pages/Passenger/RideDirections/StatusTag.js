import {Alert, AlertDescription, AlertIcon, AlertTitle, Card} from "@chakra-ui/react";
import React from "react";

export default function StatusTag({isStarted, isComplete, isPickedUp}) {
    let rideStatus = 'error'
    let rideMessage = '';
    if (!isStarted && !isComplete) {
        rideStatus = 'error';
        rideMessage = 'Ride has not yet started'
    } else if (isStarted && !isComplete && !isPickedUp) {
        rideStatus = 'info';
        rideMessage = 'Driver is on their way'
    } else if (isStarted && !isComplete && isPickedUp) {
        rideStatus = 'info';
        rideMessage = 'Passenger has been picked up'
    } else {
        rideStatus = 'success';
        rideMessage = 'Ride is complete'
    }
    return <Card>
        <Alert status={rideStatus}>
            <AlertIcon/>
            <AlertTitle>{rideMessage}</AlertTitle>
        </Alert>
    </Card>
}