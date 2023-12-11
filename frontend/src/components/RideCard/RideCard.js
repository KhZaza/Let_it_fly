import {
    Box,
    Card,
    CardBody,
    HStack,
    StackDivider,
    Text,
    VStack,
    ListItem,
    List, ListIcon, Avatar, Button, AvatarGroup
} from "@chakra-ui/react";
import {FiCircle, FiMapPin} from "react-icons/fi";
import React from "react";

export default function RideCard({destination, pickups, driverName, carType, date, time, cost, type, sharedRiders=null,
                                     clickAction=(()=>{})}) {
    return (
        <Card key={'outline'} variant={'outline'}>
            <CardBody>
                <VStack divider={<StackDivider/>}>
                    <Box>
                        <VStack>
                        <Text fontSize={'xl'} fontWeight={'bold'}>
                            <List spacing={3}>
                                {pickups.map(location=>(
                                    <ListItem id={location.id}>
                                    <ListIcon as={FiCircle} color='green.500' />
                                    {location.name}
                                    </ListItem>
                                    ))
                                }
                                <ListItem>
                                    <ListIcon as={FiMapPin} color='green.500' />
                                    <b>{destination}</b>
                                </ListItem>
                            </List>
                        </Text>
                        <AvatarGroup size='sm' max={4}>
                            {sharedRiders?.map(user=><Avatar id={user.id} name={user.name} />)}
                        </AvatarGroup>
                        </VStack>
                    </Box>
                    <Box>
                        <HStack divider={<StackDivider/>}>
                            <Box>
                                <Text fontSize={'4xl'} fontWeight={'bold'}>
                                    {date}
                                </Text>
                                <Box fontSize={'sm'}>
                                    {time}
                                </Box>
                            </Box>
                            <Box>
                                <Text fontSize={'4xl'} fontWeight={'bold'}>
                                    {cost}
                                </Text>
                                <Box fontSize={'sm'}>
                                    {type}
                                </Box>
                            </Box>
                        </HStack>
                    </Box>
                    <Box>
                        <HStack>
                            <HStack>
                                <Avatar name={driverName} />
                                <VStack
                                    display={{ md: "flex" }}
                                    alignItems="flex-start"
                                    spacing="1px"
                                    ml="2"
                                >
                                    <Text fontSize="md">
                                        {driverName}
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        {carType}
                                    </Text>
                                </VStack>
                            </HStack>
                            <Box>
                                <Button colorScheme="gray" onClick={clickAction}>View</Button>
                            </Box>
                        </HStack>
                    </Box>
                </VStack>
            </CardBody>
        </Card>
    )
}