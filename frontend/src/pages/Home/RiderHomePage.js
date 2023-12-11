import Hero from "../../components/Home/Hero/Hero";
import {Box, Button, HStack, Spinner} from "@chakra-ui/react";
import React, {useEffect, useState} from "react";
import RideCard from "../../components/RideCard/RideCard";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../features/Authentication/authProvider";

export default function RiderHomePage() {
    const {user} = useAuth();
    const [firstLoad, setFirstLoad] = useState(false);
    const navigate = useNavigate();
    const [rides, setRides] = useState([]);
    const initRideList = async () => {
        // make a call to API to get rides
        let curDate = new Date()
        try {
            const response = await axios.post('http://localhost:8000/api/customer/reservations/get', {});//{'date': curDate.toISOString().substring(0, 10)});
            console.log(response.data);
            setRides(response.data.rides)
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        if (!firstLoad) {
            initRideList().then(setFirstLoad(true))
        }
    }, [firstLoad]);
    if (firstLoad) {
        if (rides.length > 0) {
            let curDate = new Date(rides[0].reservationTime)
            return (
                <Box p="4">
                    <Hero text='Get ready for your upcoming trip'>
                        <RideCard
                            key={rides[0].rideId}
                            destination={rides[0].address}
                            pickups={[]}
                            driverName={user.firstName + ' ' + user.lastName}
                            date={curDate.toLocaleString('default', {month: 'short'}) + ' ' + curDate.getDate()}
                            time={curDate.toLocaleTimeString()}
                            cost={`\$${rides[0].price.toFixed(2)}`}
                            type='Ride'
                            carType='Ride'
                            sharedRiders={[]}
                            clickAction={() => {
                                navigate(`/route/${rides[0].rideId}`)
                            }}
                        />
                    </Hero>
                </Box>
            )
        } else {
            return (
                <Box p="4">
                    <Hero text='Welcome!'>
                        <HStack spacing='2'>
                            <Button onClick={() => {
                                navigate('/reservation')
                            }}>Book a Ride</Button>
                            <Button onClick={() => {
                                navigate('/upcoming')
                            }}>Upcoming Rides</Button>
                            <Button onClick={() => {
                                navigate('/history')
                            }}>Ride History</Button>
                        </HStack>
                    </Hero>
                </Box>
            )
        }
    } else {
        return <Box>
            <Spinner
                thickness='4px'
                speed='0.65s'
                emptyColor='gray.200'
                color='blue.500'
                size='xl'
            />
        </Box>
    }
}