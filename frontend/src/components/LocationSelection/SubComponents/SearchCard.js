import {Button, Card, CardFooter, CardHeader, Heading, HStack, ListIcon} from "@chakra-ui/react";
import {FiMapPin} from "react-icons/fi";
import React from "react";

export default function SearchCard({feature, setDest, setPickup}) {
    return <Card size='sm' variant='outline'><CardHeader>
        <Heading size='xs' textTransform='uppercase'>
            <ListIcon as={FiMapPin} color='green.500'/>{feature.properties.address}
        </Heading>
    </CardHeader>
        <CardFooter>
            <HStack>
                <Button onClick={() => setDest(feature)}>Destination</Button>
                <Button onClick={() => setPickup(feature)}>Pickup</Button>
            </HStack>
        </CardFooter>
    </Card>
}