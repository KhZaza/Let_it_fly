import axios from "axios";
import {Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Card} from "@chakra-ui/react";
import React from "react";

export default function RideStatus({id,setIsStarted}) {
    const startRide = async () => {
        // make a call to API to get rides
        try {
            const response = await axios.post('http://localhost:8000/api/driver/ride/start', {'rideId': id});
            console.log(response.data);
            setIsStarted()
        } catch (e) {
            console.error(e);
        }
    }

    return <Card>
        <Alert status='error'>
            <AlertIcon />
            <AlertTitle>Not Started</AlertTitle>
            <AlertDescription><Button onClick={()=>startRide()}>Start Ride</Button>
            </AlertDescription>
        </Alert>
    </Card>
}