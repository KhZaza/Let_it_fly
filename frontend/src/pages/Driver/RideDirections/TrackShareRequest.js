import axios from "axios";
import {Alert, AlertDescription, AlertIcon, AlertTitle, Button, Card, HStack} from "@chakra-ui/react";
import React, {useEffect, useState} from "react";

export default function TrackShareRequest({refresh}) {
    const [requestExists, setRequestExists] = useState(false);

    const acceptRequest = async () => {
        // make a call to API to get rides
        try {
            const response = await axios.post('http://localhost:8000/api/driver/share/accept', {});
            console.log(response.data);
            setRequestExists(false)
        } catch (e) {
            console.error(e);
        }
    }

    const declineRequest = async () => {
        // make a call to API to get rides
        try {
            const response = await axios.post('http://localhost:8000/api/driver/share/decline', {});
            console.log(response.data);
            setRequestExists(false)
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        const sendData = async () => {
            try {
                const response = await axios.post('http://localhost:8000/api/driver/share/requests', {});
                console.log(response.data);
                setRequestExists(true);
            } catch (e) {
                console.error(e)
                setRequestExists(false)
            }
        }
        // send initialization message
        const intervalId = setInterval(() => {
            sendData()
        }, 2000);

        // clear interval on re-render to avoid memory leaks
        return () => clearInterval(intervalId);
    }, []);

    if (requestExists) {
        return <Card>
            <Alert status='warning'>
                <AlertIcon/>
                <AlertTitle>New Passenger Request</AlertTitle>
                <AlertDescription>
                    <HStack spacing='2'>
                        <Button onClick={() => {
                            acceptRequest().then(() => refresh());
                        }}>Accept</Button>
                        <Button onClick={() => {
                            declineRequest();
                        }}>Decline</Button>
                    </HStack>
                </AlertDescription>
            </Alert>
        </Card>
    }
}