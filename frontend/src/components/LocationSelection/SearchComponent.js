import axios from "axios";
import {
    Box,
    Button,
    Card,
    CardBody,
    Input,
    InputGroup,
    InputRightElement,
    List,
    ListItem,
    Stack
} from "@chakra-ui/react";
import React, {useState} from "react";
import {useLoc} from "../../features/Location/locProvider";
import SearchCard from "./SubComponents/SearchCard";


export default function SearchComponent({
                                            searchResults, setSearchResults, setDestPoint,
                                            setPickupPoint
                                        }) {
    const {lat, long} = useLoc();
    const [value, setValue] = useState('')
    const handleChange = (event) => setValue(event.target.value)
    const getSearch = (query) => {
        axios({
            url: "http://localhost:8000/api/location/search",
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                "query": query,
                "sort_key": {
                    "type": "Point",
                    "coordinates": [
                        long,
                        lat
                    ]
                }
            },
        }).then((res) => {
            console.log(res);
            setSearchResults(res.data);
        }).catch((e) => {
        });
    }
    if (searchResults?.features && searchResults?.features?.length > 0) {
        return (
            <Stack spacing='4'>
                <Box>
                    <InputGroup size='md'>
                        <Input
                            value={value}
                            onChange={handleChange}
                            pr='4.5rem'
                            type='text'
                            placeholder='Enter an Address'
                        />
                        <InputRightElement width='5rem'>
                            <Button h='1.75rem' size='sm' onClick={() => getSearch(value)}>
                                Search
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                </Box>
                <Box maxH={256} overflowY='scroll'>
                    <List spacing={3}>
                        {searchResults?.features?.map((e) =>
                            <ListItem key={e.properties.address}>
                                <SearchCard feature={e} setDest={(v) => {
                                    setDestPoint(v);
                                    setSearchResults({})
                                }} setPickup={(v) => {
                                    setPickupPoint(v);
                                    setSearchResults({})
                                }}/>
                            </ListItem>
                        )
                        }
                    </List>
                </Box>
            </Stack>
        )
    } else {
        return (
            <Stack spacing='4'>
                <Box>
                    <InputGroup size='md'>
                        <Input
                            value={value}
                            onChange={handleChange}
                            pr='4.5rem'
                            type='text'
                            placeholder='Enter an Address'
                        />
                        <InputRightElement width='5rem'>
                            <Button h='1.75rem' size='sm' onClick={() => getSearch(value)}>
                                Search
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                </Box>
            </Stack>
        )
    }


}