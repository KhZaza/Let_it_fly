import axios from "axios";
import {
    Box,
    List,
    ListItem,
    Stack
} from "@chakra-ui/react";
import React, {useEffect, useState} from "react";
import SearchCard from "./SubComponents/SearchCard";


export default function AirportComponent({
                                             setDestPoint,
                                             setPickupPoint}) {
    const [searchResults, setSearchResults] = useState([]);
    const getSearch = () => {
        axios({
            url: "http://localhost:8000/api/location/airports",
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            data: {},
        }).then((res) => {
            console.log(res);
            setSearchResults(res.data);
        }).catch((e) => {
        });
    }

    useEffect(() => {
        getSearch()
    }, []);
    if (searchResults?.features && searchResults?.features?.length > 0) {
        return (
            <Stack spacing='4'>
                <Box maxH={256} overflowY='scroll'>
                    <List spacing={3}>
                        {searchResults?.features?.map((e) =>
                            <ListItem key={e.properties.address} >
                                <SearchCard feature={e} setDest={(v) => {
                                    setDestPoint(v);
                                }} setPickup={(v) => {
                                    setPickupPoint(v);
                                }}/>
                            </ListItem>
                        )
                        }
                    </List>
                </Box>
            </Stack>
        )
    }

}