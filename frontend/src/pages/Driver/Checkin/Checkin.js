import React, {useEffect, useState} from "react";
import axios from "axios";
import {Alert, AlertIcon, Box, Button, VStack} from "@chakra-ui/react";
import PositionMap from "../../../components/Map/TurnByTurn/PositionMap";
import LocationProvider from "../../../features/Location/locProvider";

export default function Checkin() {
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    useEffect(() => {
        const getState = async () => {
            // make a call to API to get rides
            try {
                const response = await axios.post('http://localhost:8000/api/driver/status', {});
                console.log(response.data);
                setIsCheckedIn(true)
            } catch (e) {
                console.error(e);
                setIsCheckedIn(false)
            }
        }
        getState();
    }, [isCheckedIn]);

    const checkIn = async () => {
        // make a call to API to get rides
        try {
            const response = await axios.post('http://localhost:8000/api/driver/checkin', {});
            console.log(response.data);
            setIsCheckedIn(true)
        } catch (e) {
            console.error(e);
        }
    }
    const checkOut = async () => {
        // make a call to API to get rides
        try {
            const response = await axios.post('http://localhost:8000/api/driver/checkout', {});
            console.log(response.data);
            setIsCheckedIn(false)
        } catch (e) {
            console.error(e);
        }
    }
    return <LocationProvider>
        {isCheckedIn ?
            <Box p="4">
                <VStack>
                    <Alert status='success'>
                        <AlertIcon/>
                        Driver is checked in
                    </Alert>
                    <Button onClick={checkOut}>Check Out</Button>
                    <PositionMap/>
                </VStack>
            </Box>
            :
            <Box p="4">
                <VStack>
                    <Alert status='error'>
                        <AlertIcon/>
                        Driver is not checked in
                    </Alert>
                    <Button onClick={checkIn}>Check In</Button>
                </VStack>
            </Box>
        }
    </LocationProvider>
}
