import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LocationContext = createContext();

const LocationProvider = ({ children }) => {
    // State to hold the authentication token
    const [lat, setLat] = useState();

    // state to hold user object if logged in
    const [long, setLong] = useState();



    useEffect(() => {

        const intervalId = setInterval(() => {
            navigator.geolocation.getCurrentPosition((position) => {
                if (position.coords.latitude !== lat || position.coords.longitude !== long) {
                    setPosition(position);
                }
            });
        }, 1000);

        // clear interval on re-render to avoid memory leaks
        return () => clearInterval(intervalId);
        }, [])

    const setPosition = (position) => {
        setLat(position.coords.latitude)
        setLong(position.coords.longitude)
    }

    // Memoized value of the authentication context
    const contextValue = useMemo(
        () => ({
            lat,
            setLat,
            long,
            setLong
        }),
        [lat, long]
    );

    // Provide the authentication context to the children components
    return (
        <LocationContext.Provider value={contextValue}>{children}</LocationContext.Provider>
    );
};

export const useLoc = () => {
    return useContext(LocationContext);
};

export default LocationProvider;
