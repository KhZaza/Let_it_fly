import React, { useState, useEffect } from 'react';
import {
    Alert, Box, Text, SimpleGrid
} from "@chakra-ui/react";
import axios from "axios";
import RideCard from '../../../components/RideCard/RideCard';
import {useAuth} from "../../../features/Authentication/authProvider";
import {useNavigate} from "react-router-dom";

export default function RideHistoryPage() {
    const {user} = useAuth();
    const navigate = useNavigate();
    const [rides, setRides] = useState([]);
    const [error, setError] = useState(null);

    const fetchRideHistory = async () => {
        let curDate = new Date()
        try {
            const response = await axios.post('http://localhost:8000/api/driver/reservations/history', {'date': curDate.toISOString().substring(0, 10)});
            console.log(response.data);
            setRides(response.data.rides)
        } catch (e) {
            setError('Failed to fetch ride history');
        }
    };

    useEffect(() => {
        fetchRideHistory();
    }, []);

    return (
        <>
            <Box bg="teal.500" p={4} color="white">
                <Text fontSize="2xl">Your Ride History</Text>
                <Text>Explore the rides you've taken</Text>
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
    );
}
