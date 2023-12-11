import {useAuth} from "../../../features/Authentication/authProvider";
import React, {useEffect, useState} from "react";
import axios from "axios";
import {Box, SimpleGrid, Text} from "@chakra-ui/react";
import RideCard from "../../../components/RideCard/RideCard";
import {useNavigate} from "react-router-dom";

export default function RideListCustomer() {
    const {user} = useAuth();
    const navigate = useNavigate();
    const [rides, setRides] = useState([]);
    const [firstLoad, setFirstLoad] = useState(false);
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
            initRideList()
            setFirstLoad(true)
        }
    }, [firstLoad]);

    return <>
        <Box bg="teal.500" p={4} color="white">
            <Text fontSize="2xl">Your Upcoming Rides</Text>
            <Text>Review the rides you have scheduled</Text>
        </Box>
        <Box p="4">
            <SimpleGrid spacing={10}>
                {rides.map((e, index) => {
                    let curDate = new Date(e.reservationTime)
                    return <RideCard
                        key={e.rideId}
                        destination={e.address}
                        pickups={[]}
                        driverName={user.firstName + ' ' + user.lastName}
                        date={curDate.toLocaleString('default', {month: 'short'}) + ' ' + curDate.getDate()}
                        time={curDate.toLocaleTimeString()}
                        cost={`\$${e.price.toFixed(2)}`}
                        type='Ride'
                        carType='Ride'
                        sharedRiders={[]}
                        clickAction={() => {
                            navigate(`/route/${e.rideId}`)
                        }}
                    />
                })}
            </SimpleGrid>
        </Box>
    </>
}