import {Card, CardBody, Tab, TabList, TabPanel, TabPanels, Tabs, useColorModeValue} from "@chakra-ui/react";
import React from "react";
import SearchComponent from "./SearchComponent";
import AirportComponent from "./AirportComponent";

export default function CombinedSearchComponent({
                                                    searchResults,
                                                    setSearchResults,
                                                    setDestPoint,
                                                    setPickupPoint
                                                }) {
    return <Card size='sm' variant='outline'>
        <CardBody>
            <Tabs variant='soft-rounded' colorScheme={useColorModeValue('green', 'gray')}>
                <TabList>
                    <Tab>Airports</Tab>
                    <Tab>Search</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <AirportComponent setDestPoint={setDestPoint}
                                          setPickupPoint={setPickupPoint}/>
                    </TabPanel>

                    <TabPanel>
                        <SearchComponent searchResults={searchResults} setSearchResults={setSearchResults}
                                         setDestPoint={setDestPoint}
                                         setPickupPoint={setPickupPoint}/>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </CardBody>
    </Card>
}