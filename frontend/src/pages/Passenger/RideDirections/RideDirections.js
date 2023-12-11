import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import axios from "axios";
import LocationProvider from "../../../features/Location/locProvider";
import RideDirectionsMap from "./RideDirectionsMap";
import StatusTag from "./StatusTag";
import {Box, VStack} from "@chakra-ui/react";
import ReviewTag from "./ReviewTag";
import {useAuth} from "../../../features/Authentication/authProvider";

export default function RideDirectionsCustomer() {
    const {user} = useAuth();
    let {id} = useParams();
    let [route, setRoute] = useState({});
    let [loaded, setLoaded] = useState(false)
    let [isStarted, setIsStarted] = useState(false)
    let [isComplete, setIsComplete] = useState(false)
    let [isReviewed, setIsReviewed] = useState(false)
    let [isPickedUp, setIsPickedUp] = useState(false)
    let [reviewId, setReviewId] = useState('')
    const getDirections = async () => {
        // make a call to API to get rides
        try {
            const response = await axios.post('http://localhost:8000/api/reservation/route/get', {'rideId': id});
            console.log(response.data);
            setRoute(response.data.route)
            setLoaded(true)
        } catch (e) {
            console.error(e);
        }
    }

    const getRideState = async () => {
        // make a call to API to get rides
        try {
            const response = await axios.post('http://localhost:8000/api/ride/customer/status', {'rideId': id});
            console.log(response.data);
            if (response.data.started) {
                setIsStarted(response.data.started)
            }
            if (response.data.complete) {
                setIsComplete(response.data.complete)
            }
            if (response.data.reviewCreated) {
                setIsReviewed(response.data.reviewCreated)
            }
            if (response.data.reviewCreated) {
                setReviewId(response.data.reviewId)
            }
        } catch (e) {
            console.error(e);
        }
    }
    const getPassengerState = async () => {
        // make a call to API to get rides
        try {
            const response = await axios.post('http://localhost:8000/api/passenger/status', {'custId': user.user_id});
            console.log(response.data);
            if (response.data.rideId === id && response.data.pickedUp) {
                setIsPickedUp(response.data.pickedUp)
            }
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        getDirections();
        getRideState();
        if (!isComplete) {
            const intervalId = setInterval(() => {
                getRideState()
            }, 5000);
            const intervalId2 = setInterval(() => {
                getPassengerState()
            }, 5000);
            // clear interval on re-render to avoid memory leaks
            return () => {
                clearInterval(intervalId);
                clearInterval(intervalId2);
            }
        }
    }, [isComplete]);

    if (loaded) {
        return <>
            <LocationProvider>
                <RideDirectionsMap routeLayer={route} id={id} isStarted={isStarted || !isComplete}>
                    <Box maxW='sm' m={2}>
                        <VStack align='left'>
                            <StatusTag isComplete={isComplete} isStarted={isStarted} isPickedUp={isPickedUp}/>
                            {isComplete ? <ReviewTag isReviewed={isReviewed} reviewId={reviewId} id={id}/> : <></>}
                        </VStack>
                    </Box>
                </RideDirectionsMap>
            </LocationProvider>
        </>
    }

}