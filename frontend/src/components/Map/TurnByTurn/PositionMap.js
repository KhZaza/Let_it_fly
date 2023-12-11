import {Marker} from "react-map-gl/maplibre";
import MapContainer from "../Map";
import React, {useEffect, useState} from "react";
import axios from "axios";
import {useAuth} from "../../../features/Authentication/authProvider";

export default function PositionMap({children}) {
    const {user} = useAuth();
    const [markerVal, setMarkerVal] = useState([0, 0]);
    const [lat, setLat] = useState(0);
    const [long, setLong] = useState(0);
    let zoom = 17;
    const [firstRender, setFirstRender] = useState(false);
    const updatePoint = async (long, lat) => {
        setMarkerVal([long, lat]);
        // send to server
        try {
            const response = await axios.post(
                "http://localhost:8000/api/position/set",
                {
                    lat: lat,
                    long: long,
                }
            );
        } catch (e) {
            console.error(e);
        }
    };

    const getLocationPosition = () => {
        navigator.geolocation.getCurrentPosition((position) => {
            updatePoint(position.coords.longitude, position.coords.latitude);
            setLat(position.coords.latitude);
            setLong(position.coords.longitude);

        });
    }

    const getPosition = async () => {
        // try to retrieve location from server
        try {
            const response = await axios.post(
                "http://localhost:8000/api/position/get",
                {"id": user.user_id}
            );
            console.log("Position data retrieved", response.data);
            updatePoint(response.data.long, response.data.lat);
            setLat(response.data.lat);
            setLong(response.data.long);
        } catch (error) {
            // no location on server, retrieve from browser
            console.error(error)
            getLocationPosition();
        }
    };



    useEffect(() => {
        if (!firstRender) {
            getPosition().then(setFirstRender(true))
        }
    }, [firstRender]);

    if (firstRender) {
        return (
            <MapContainer lat={lat} lng={long} zoom={zoom} height={"100vh"}>
                {children}
                <Marker
                    latitude={markerVal[1]}
                    longitude={markerVal[0]}
                    draggable={true}
                    anchor="bottom"
                    onDragEnd={(e) => updatePoint(e.lngLat.lng, e.lngLat.lat)}
                />
            </MapContainer>
        );
    }
}
