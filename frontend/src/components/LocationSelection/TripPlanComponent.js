import {
    Tag,
    TagCloseButton,
    TagLabel,
    OrderedList,
    ListItem,
    CardBody,
    Card,
    Heading,
    StackDivider,
    VStack, Box, HStack, Text
} from "@chakra-ui/react";
import {FiRefreshCw} from "react-icons/fi";

export default function TripPlanComponent({
                                              destPoint,
                                              setDestPoint,
                                              pickupPoint,
                                              setPickupPoint
                                          }) {
    const flip = () => {
        const destTemp = destPoint
        const pickupTemp = pickupPoint
        setPickupPoint(destTemp) // swap a
        setDestPoint(pickupTemp) // swap b
    }
    return (
        <Card size='sm' variant='outline'>
            <CardBody>
                <VStack divider={<StackDivider/>}>
                    <Heading size='md'>Your Trip Plan</Heading>
                    <Box maxH={256} overflowY='scroll'><HStack>
                        <Box>
                            <FiRefreshCw size={30} onClick={flip}/>
                        </Box>
                        <Box>
                            <VStack>
                                <VStack>
                                    <Text>
                                        Pickup:
                                    </Text>
                                    {(pickupPoint !== null) ? <Tag
                                        size='md'
                                        borderRadius='full'
                                        variant='solid'
                                        colorScheme='green'
                                    >
                                        <TagLabel>{pickupPoint.properties.address}</TagLabel>
                                        <TagCloseButton onClick={() => setPickupPoint(null)}/>
                                    </Tag> : <Tag
                                        size='md'
                                        borderRadius='full'
                                        variant='solid'
                                        colorScheme='red'
                                    >
                                        <TagLabel>None Selected</TagLabel>
                                    </Tag>}

                                </VStack>
                                <VStack>
                                    <Text>
                                        Dropoff:
                                    </Text>
                                    {(destPoint !== null) ? <Tag
                                        size='md'
                                        borderRadius='full'
                                        variant='solid'
                                        colorScheme='green'
                                    >
                                        <TagLabel>{destPoint.properties.address}</TagLabel>
                                        <TagCloseButton onClick={() => setDestPoint(null)}/>
                                    </Tag> : <Tag
                                        size='md'
                                        borderRadius='full'
                                        variant='solid'
                                        colorScheme='red'
                                    >
                                        <TagLabel>None Selected</TagLabel>
                                    </Tag>}
                                </VStack>
                            </VStack>
                        </Box>
                    </HStack>
                    </Box>
                </VStack>
            </CardBody>
        </Card>
    )
        ;
}