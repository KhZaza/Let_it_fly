import {
    Alert, AlertIcon,
    Box,
    Button, Checkbox,
    Heading, Input,
    Select,
    Text, useColorModeValue
} from "@chakra-ui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import React, {useEffect, useState} from "react";
import axios from "axios";
import {useAuth} from "../../features/Authentication/authProvider";


export default function DetailsStep({
                                        startDate,
                                        setStartDate,
                                        carType,
                                        setCarType,
                                        setDriverResults,
                                        rideType,
                                        setRideType,
                                        setIsResultsLoaded,
                                        nextStep,
                                        destPoint,
                                        pickupPoint
                                    }) {
    const {user} = useAuth();
    const [isOnDemand, setIsOnDemand] = useState(false);
    const [isShared, setIsShared] = useState(false);
    const [pricesTable, setPricesTable] = useState({})
    const [firstLoad, setFirstLoad] = useState(false)

    const getPrices = async () => {
        try {
            // Send the password to your API endpoint
            const response = await axios.post('http://localhost:8000/api/price/table', {});
            setPricesTable(response.data);
            setFirstLoad(true)
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        getPrices()
    }, []);

    if (isOnDemand) {
        if (isShared) {
            setRideType('ON_DEMAND_CAR_SHARE')
        } else {
            setRideType('ON_DEMAND')
        }
    } else {
        setRideType('RESERVATION')
    }

    const toggleOnDemand = () => {
        setStartDate(new Date());
        setIsOnDemand(!isOnDemand);
    };

    const sendUpdate = async (values) => {
        console.log(values);
        try {
            // Send the password to your API endpoint
            const response = await axios.post('http://localhost:8000/api/reservation/search', values);
            console.log(response);
            setIsResultsLoaded(true);
            setDriverResults(response.data.results);
        } catch (err) {
            console.error(err);
        }
    };

    const makeReq = async () => {
        setIsResultsLoaded(false);
        setDriverResults([]);
        let values = {
            "carType": carType,
            "reservationTime": startDate.toISOString(),
            "rideType": rideType,
            "destPoint": {
                ...destPoint.geometry,
                'properties': {"address": destPoint.properties.address, "index": 1, "passengerId": user.user_id}
            },
            "pickupPoint": {
                ...pickupPoint.geometry,
                'properties': {"address": pickupPoint.properties.address, "index": 1, "passengerId": user.user_id}
            },
        }
        console.log(values)
        nextStep();
        await sendUpdate(values);
    }
    const buttonSchema = useColorModeValue('green', 'gray')
    if (firstLoad) {
        return (
            <Box>
                <Heading size='xl'>Ride Settings</Heading>
                <Heading size='lg'>Price/mi: ${pricesTable[rideType][carType]}</Heading>
                <Heading size='sm'>Minimum charge of $15 per ride</Heading>
                <Text mt='2'>Car Type</Text>
                <Select
                    placeholder='Choose Type'
                    size='lg'
                    name="carType"
                    onChange={(e) => setCarType(e.target.value)}
                    defaultValue={carType}
                >
                    <option value='SEDAN'>Sedan</option>
                    <option value='SUV'>SUV</option>
                    <option value='CARGO'>Cargo</option>
                </Select>


                <Text mt='2'>Ride Type</Text>
                <Button onClick={toggleOnDemand} colorScheme={buttonSchema}>
                    {isOnDemand ? 'ASAP' : 'In Advance'}
                </Button>
                <br/>

                {!isOnDemand ? (
                    <Box>
                        <Text mt='2'>Date & Time of Reservation</Text>

                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            showTimeSelect
                            inline
                        />
                    </Box>
                ) : (
                    <Box>
                        <Text>Carpooling riders recieve an additional $10 discount if a second passenger is picked
                            up</Text>
                        <Checkbox isChecked={isShared} onChange={(e) => setIsShared(e.target.checked)} defaultChecked
                                  mt='2'>Allow carpooling</Checkbox>

                    </Box>
                )}
                <br/>
                <Button onClick={makeReq}>Proceed</Button>
            </Box>
        )
    }
}