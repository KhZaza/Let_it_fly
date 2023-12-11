import Map, {NavigationControl, ScaleControl, MapProvider, Marker} from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';
import {useBreakpointValue} from "@chakra-ui/react";
export default function MapContainer({lat, lng, zoom, children, height='100vh', sources=null, layers=null}) {
    const controlPosition = useBreakpointValue({ base: "bottom-right", sm: 'bottom-right', lg: "top-right" }, { ssr: false });
    return (
        <>
            <MapProvider>
            {(lat && lng) ?
        <Map
            initialViewState={{
                longitude: lng,
                latitude: lat,
                zoom: zoom
            }}
            style={{height: height}}
            mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        >
            <NavigationControl position={controlPosition} />
            <ScaleControl />
            {children}
        </Map>
            :
            <></>
            }
            </MapProvider>
        </>
    );
}