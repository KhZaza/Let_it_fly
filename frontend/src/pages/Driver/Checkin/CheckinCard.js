import React, {useEffect, useState} from "react";
import axios from "axios";
import {Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Card, VStack} from "@chakra-ui/react";
import PositionMap from "../../../components/Map/TurnByTurn/PositionMap";

export default function CheckinCard() {
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
    return <>
        {
            (isCheckedIn) ?
                <Card>
                    <Alert status='success'>
                        <AlertIcon/>
                        <AlertTitle>Driver is checked in</AlertTitle>
                        <AlertDescription>
                            <Button onClick={checkOut}>Check Out</Button>
                        </AlertDescription>
                    </Alert>
                </Card>
                :
                <Card>
                    <Alert status='error'>
                        <AlertIcon/>
                        <AlertTitle>Driver is not checked in</AlertTitle>
                        <AlertDescription>
                            <Button onClick={checkIn}>Check In</Button>
                        </AlertDescription>
                    </Alert>
                </Card>
        }
    </>
}
