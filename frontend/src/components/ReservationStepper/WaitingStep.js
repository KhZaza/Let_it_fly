import {Alert, AlertDescription, AlertIcon, AlertTitle, Button, Spinner} from "@chakra-ui/react";
import {Link} from "react-router-dom";
import React, {useEffect, useState} from "react";
import axios from "axios";

export default function WaitingStep({rideId}) {
    const [isReserved, setIsReserved] = useState(false);
    const [isRejected, setIsRejected] = useState(false);

    useEffect(() => {
        const sendData = async () => {
            try {
                const response = await axios.post('http://localhost:8000/api/reservation/share/status', {'rideId': rideId});
                console.log(response.data);
                setIsReserved(response.data.accepted)
            } catch (e) {
                console.error(e)
                setIsRejected(true)
                clearInterval(intervalId)
            }
        }
        // send initialization message
        const intervalId = setInterval(() => {
            sendData()
        }, 2000);

        // clear interval on re-render to avoid memory leaks
        return () => clearInterval(intervalId);
    }, []);
    if (isRejected) {
        return <Alert
            status='error'
            variant='subtle'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            textAlign='center'
            height='100vh'
        >
            <AlertIcon boxSize='40px' mr={0}/>
            <AlertTitle mt={4} mb={1} fontSize='lg'>
                Reservation Rejected
            </AlertTitle>
            <AlertDescription maxWidth='sm'>
                Your ride request has been rejected by the driver.
                <br/>
                <Link to={'/'}><Button>Go Home</Button></Link>
            </AlertDescription>
        </Alert>
    } else if (isReserved) {
        return <Alert
            status='success'
            variant='subtle'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            textAlign='center'
            height='100vh'
        >
            <AlertIcon boxSize='40px' mr={0}/>
            <AlertTitle mt={4} mb={1} fontSize='lg'>
                Reservation submitted!
            </AlertTitle>
            <AlertDescription maxWidth='sm'>
                Your ride has been reserved.
                <br/>
                <Link to={'/'}><Button>Go Home</Button></Link>
            </AlertDescription>
        </Alert>
    }

    return <Alert
        status='warning'
        variant='subtle'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        textAlign='center'
        height='100vh'
    >
        <AlertIcon boxSize='40px' mr={0}/>
        <AlertTitle mt={4} mb={1} fontSize='lg'>
            Your request is waiting for driver approval
        </AlertTitle>
        <AlertDescription maxWidth='sm'>
            <Spinner
                thickness='4px'
                speed='0.65s'
                emptyColor='gray.200'
                color='blue.500'
                size='xl'
            />
            <br/>
            <Link to={'/'}><Button>Go Home</Button></Link>
        </AlertDescription>
    </Alert>
}