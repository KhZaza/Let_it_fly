
import {
    Box,
    Card,
    CardBody, Heading, HStack,
    Stack, VStack
} from "@chakra-ui/react";
import {lineString, length} from "@turf/turf";

function calculateLineString(route, index, endIndex) {
    let routeList = route.coordinates.slice(index, endIndex + 1);
    if (routeList.length < 2) {
        return 0;
    }
    let lineStringVal = lineString(routeList)
    console.log(lineStringVal)
    return length(lineStringVal, {units: 'miles'});
}

export default function TurnByTurnOverlay({curPos, route, instructions, index}) {
    if (!instructions) {
        return <Card size='sm' variant='outline'></Card>
    }
    console.log(index)
    const inst = instructions.find((element) => (element.startIndex < index && element.endIndex >= index)) || instructions[0];
    console.log(inst)
    const lineStringDist = calculateLineString(route, index, inst.endIndex).toFixed(2)

    return <Card size='sm' variant='outline'>
        <CardBody>
            <Stack spacing='4'>
                <Box>
                    <HStack>
                        <VStack>
                            <Heading size='xl'>{inst.type}</Heading>
                            <Heading size='sm'>{inst.modifier}</Heading>
                        </VStack>
                        <VStack>
                            <Heading size='md'>{inst.name}</Heading>
                            <Heading size='sm'>{`In ${lineStringDist} miles`}</Heading>
                        </VStack>
                    </HStack>
                </Box>
            </Stack>
        </CardBody>
    </Card>

}