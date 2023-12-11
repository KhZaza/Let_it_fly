import Hero from "../../components/Home/Hero/Hero";
import {Alert, AlertDescription, AlertIcon, Box, Button, Fade, HStack, Text, VStack} from "@chakra-ui/react";
import React, {useEffect, useState} from "react";
import axios from "axios";
import {Link} from "react-router-dom";
import PositionMap from "../../components/Map/TurnByTurn/PositionMap";
import CheckinCard from "../Driver/Checkin/CheckinCard";
import {useAuth} from "../../features/Authentication/authProvider";

export default function DriverHomePage() {
    const {token, user} = useAuth();
    const [error, setError] = useState(null);
    const fetchData = async () => {
        axios.defaults.headers.common["Authorization"] = "Bearer " + token;
        try {
            const response = await axios.post(
                "http://localhost:8000/api/car/retrieve",
                {}
            );
            console.log("Car data retrieved", response.data);
        } catch (error) {
            setError(error.response.data.detail);
            console.error("Error while fetching car data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            {error ? (
                <>
                    <Fade in={error}>
                        <Alert status='error'>
                            <AlertIcon/>
                            <HStack spacing='2'>
                                <Text>{error}</Text>
                                <Link to={'/settings'}><Button>Setup Car</Button></Link>
                            </HStack>
                        </Alert>
                    </Fade>
                    <br/>
                </>
            ) : (
                <PositionMap>
                    <Box maxW='sm' m={2}>
                        <VStack align='left'>
                            <CheckinCard/>
                        </VStack>
                    </Box>
                </PositionMap>
            )
            }
        </>
    )
}