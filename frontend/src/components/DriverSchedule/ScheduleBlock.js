import React, {useState} from 'react';
import {
    Input, Flex, HStack, Text, Button
} from "@chakra-ui/react";
import {FiX} from "react-icons/fi";
import axios from "axios";

export default function ({day, id, start, end, sendUpdate, fetchData}) {
    const formatTime = (fullTime) => {
        const timeArray = fullTime.split('.')[0].split(':');
        return `${timeArray[0]}:${timeArray[1]}`;
    };

    const [startTime, setStartTime] = useState(formatTime(start));
    const [endTime, setEndTime] = useState(formatTime(end));

    const submitState = () => {
        sendUpdate(id, startTime, endTime);
        fetchData()
    };

    const doDelete = () => {
        if (id !== null) {
            axios.post(
                'http://localhost:8000/api/driver/schedule/delete',
                {"blockId": id}
            ).then((data) => {
                fetchData()
            })
                .catch((error) => console.log(error))
                .finally();
        } else {
            sendUpdate(null, null, null)
        }
    }

    return (
        <HStack align="start" spacing={4} borderBottom="1px" borderColor="gray.200" pb={4} mb={4}>
            <FiX size={20} onClick={doDelete}/>
            <Flex>
                <Text mr={2}>Start Time:</Text>
                <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                />
            </Flex>
            <Flex>
                <Text mr={2}>End Time:</Text>
                <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                />
            </Flex>
            <Flex>
                <Button colorScheme="blue" onClick={submitState}>
                    Update
                </Button>
            </Flex>
        </HStack>
    );
}