import {Box, Button, useBreakpointValue, VStack} from "@chakra-ui/react";
import MapContainer from "../Map/Map";
import {Marker} from "react-map-gl/maplibre";
import TripPlanComponent from "./TripPlanComponent";
import CombinedSearchComponent from "./CombinedSearchComponent";
import {useEffect, useState} from "react";


export default function LocationSelection({
                                              searchResults,
                                              setSearchResults,
                                              destPoint,
                                              setDestPoint,
                                              pickupPoint,
                                              setPickupPoint,
                                              nextStep
                                          }) {
    const mapHeight = useBreakpointValue({base: "50vh", sm: '50vh', lg: "77vh"}, {ssr: false});

    const [lat, setLat] = useState(0);
    const [long, setLong] = useState(0);
    const [firstRender, setFirstRender] = useState(false);

    useEffect(() => {
        if (!firstRender) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLat(position.coords.latitude)
                setLong(position.coords.longitude)
                //updatePoint(position.coords.longitude, position.coords.latitude)
                setFirstRender(true)
            });
        }
    }, [firstRender]);

    let zoom = 17;
    if (firstRender) {
        return (
            <VStack>
                <MapContainer lat={lat} lng={long} zoom={zoom} height={mapHeight}>
                    <Marker longitude={long} latitude={lat} anchor="bottom"/>
                    <Box maxW='sm' m={2} display={{base: "none", md: "block"}}>
                        <VStack align='left'>
                            <CombinedSearchComponent searchResults={searchResults}
                                                     setSearchResults={setSearchResults}
                                                     setDestPoint={setDestPoint}
                                                     setPickupPoint={setPickupPoint}/>
                            <TripPlanComponent destPoint={destPoint}
                                               setDestPoint={setDestPoint}
                                               pickupPoint={pickupPoint}
                                               setPickupPoint={setPickupPoint}/>
                        </VStack>

                    </Box>
                    {searchResults?.features?.map((e) => <Marker key={e.properties.address + 'marker'}
                                                                 longitude={e.geometry.coordinates[0]}
                                                                 latitude={e.geometry.coordinates[1]} color='red'
                                                                 anchor="bottom"/>)}
                    {(destPoint) ? <Marker key={destPoint.properties.address + 'marker'}
                                           longitude={destPoint.geometry.coordinates[0]} color='green'
                                           latitude={destPoint.geometry.coordinates[1]} anchor="bottom"/> : <></>}
                    {(pickupPoint) ? <Marker key={pickupPoint.properties.address + 'marker'}
                                             longitude={pickupPoint.geometry.coordinates[0]} color='green'
                                             latitude={pickupPoint.geometry.coordinates[1]} anchor="bottom"/> : <></>}
                </MapContainer>
                <Box display={{base: "flex", md: "none"}}>
                    <VStack align='left'>
                        <TripPlanComponent destPoint={destPoint}
                                           setDestPoint={setDestPoint}
                                           pickupPoint={pickupPoint}
                                           setPickupPoint={setPickupPoint}/>
                        <CombinedSearchComponent searchResults={searchResults} setSearchResults={setSearchResults}
                                                 setDestPoint={setDestPoint}
                                                 setPickupPoint={setPickupPoint}/>
                    </VStack>
                </Box>
                <Button onClick={() => nextStep()}>Proceed</Button>
            </VStack>
        );
    }
}