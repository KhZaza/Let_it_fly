import {Layer, Source} from "react-map-gl/maplibre";
import MapContainer from "../../../components/Map/Map";
import {useLoc} from "../../../features/Location/locProvider";
import TrackingPoint from "../../../components/Map/TrackingPoint";
import {useEffect, useState} from "react";
import axios from "axios";

export default function RideDirectionsMap({routeLayer, id, isStarted, children}) {
    const {lat, long} = useLoc();
    let zoom = 17;
    const [driverId, setDriverId] = useState('');

    useEffect(() => {
        const getDirections = async () => {
            // make a call to API to get rides
            try {
                const response = await axios.post('http://localhost:8000/api/reservations/info', {'id': id});
                console.log(response.data);
                setDriverId(response.data.driver_id)
            } catch (e) {
                console.error(e);
            }
        }
        getDirections();
    }, []);

    return <MapContainer lat={lat}
                         lng={long} zoom={zoom} height={'100vh'}>
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
        {children}
        {(isStarted) ? <TrackingPoint id={driverId}/> : <></>
        }
    </MapContainer>
}