import React, {useEffect, useState} from "react";
import {Marker} from "react-map-gl/maplibre";
import axios from "axios";

export default function TrackingPoint({id}) {
    const [lat, setLat] = useState(0);
    const [long, setLong] = useState(0);
    useEffect(() => {
        const sendData = async () => {
            try {
                const response = await axios.post('http://localhost:8000/api/position/get', {'id': id});
                console.log(response.data);
                setLat(response.data.lat)
                setLong(response.data.long)
            } catch (e) {
                console.error(e)
            }
        }
        // send initialization message
        const intervalId = setInterval(() => {
            sendData()
        }, 1000);

        // clear interval on re-render to avoid memory leaks
        return () => clearInterval(intervalId);
    }, []);

    return <Marker longitude={long} latitude={lat} anchor="bottom"/>
}