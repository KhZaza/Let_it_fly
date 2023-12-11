import {Box, useBreakpointValue, HStack, Button, Spinner, Stack} from "@chakra-ui/react";
import RideCard from "../RideCard/RideCard";
import MapContainer from "../Map/Map";
import axios from "axios";
import React, {useEffect, useState} from "react";
import {Layer, Source} from "react-map-gl/maplibre";
import {useAuth} from "../../features/Authentication/authProvider";
import RideCardReservation from "../RideCard/RideCardReservation";

export default function ReviewStep({
                                       destPoint,
                                       pickupPoint, startDate, selectedDriver, handleSubmit, carType, rideType
                                   }) {
    const {user} = useAuth();
    const path = [pickupPoint, destPoint].map((e) => e.geometry)
    const [price, setPrice] = useState(0.00)
    const [distance, setDistance] = useState(0.00)
    const [duration, setDuration] = useState(0.00)
    const [routeLayer, setRouteLayer] = useState();
    const [display, setDisplay] = useState(false);
    let zoom = 17;
    const mapHeight = useBreakpointValue({base: "50vh", sm: '50vh', lg: "77vh"}, {ssr: false});


    useEffect(() => {
        axios({
            url: "http://localhost:8000/api/route/get",
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                "steps": path
            },
        }).then((res) => {
            setRouteLayer(res.data.route);
        }).catch((e) => {
        });
        axios({
            url: "http://localhost:8000/api/reservation/price",
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                "destPoint": {
                    ...destPoint.geometry,
                    'properties': {"address": destPoint.properties.address, "index": 1, "passengerId": user.user_id}
                },
                "pickupPoint": {
                    ...pickupPoint.geometry,
                    'properties': {"address": pickupPoint.properties.address, "index": 1, "passengerId": user.user_id}
                },
                "carType": carType,
                "rideType": rideType
            },
        }).then((res) => {
            setPrice(res.data.price);
            setDuration(res.data.duration)
            setDistance(res.data.distance)
            setDisplay(true);
        }).catch((e) => {
        });
    }, []);
    const locations = [pickupPoint, destPoint].map((e, index) => ({'id': index, 'name': e.properties.address.split(',')[0]}))

    if (display) {
        return (
            <Box>
                <Stack>
                    <MapContainer lat={pickupPoint.geometry.coordinates[1]}
                                  lng={pickupPoint.geometry.coordinates[0]} zoom={zoom} height={mapHeight}>
                        {routeLayer ? <Source id="polylineLayer" type="geojson" data={routeLayer}>
                            <Layer
                                id="lineLayer"
                                type="line"
                                layout={{
                                    "line-join": "round",
                                    "line-cap": "round"
                                }}
                                paint={{
                                    "line-color": "rgba(3, 170, 238, 0.5)",
                                    "line-width": 5
                                }}
                            />
                        </Source> : <></>}

                    </MapContainer>
                    <Box>
                        <RideCardReservation
                            destination={locations.at(-1).name}
                            pickups={locations.slice(0, -1)}
                            driverName={`${selectedDriver.firstName} ${selectedDriver.lastName}`}
                            date={startDate.toLocaleString('default', {month: 'short'}) + ' ' + startDate.getDate()}
                            time={startDate.toLocaleTimeString()}
                            cost={`\$${price.toFixed(2)}`}
                            type={rideType.replaceAll('_',' ')}
                            carType={selectedDriver.car.carName}
                            sharedRiders={[]}
                            distance={distance}
                            duration={duration}
                        />
                        <Button onClick={handleSubmit}>Submit</Button>
                    </Box>
                </Stack>

            </Box>
        );
    } else {
        return (
            <Box>
                <Spinner
                    thickness='4px'
                    speed='0.65s'
                    emptyColor='gray.200'
                    color='blue.500'
                    size='xl'
                />
            </Box>
        )
    }
}