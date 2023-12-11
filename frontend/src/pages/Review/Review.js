import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import axios from "axios";
import {Box, Button, Heading, Text, useColorModeValue} from "@chakra-ui/react";

export default function Review() {
    const navigate = useNavigate();
    let {id} = useParams();
    const [name, setName] = useState('')
    const [rating, setRating] = useState(0)
    const [text, setText] = useState('')


    const getReview = async () => {
        // make a call to API to get rides
        try {
            const response = await axios.post('http://localhost:8000/api/ride/review/id', {'reviewId': id});
            console.log(response.data);
            setName(response.data.driverName)
            setRating(response.data.reviewStars)
            setText(response.data.reviewBody)
        } catch (e) {
            console.error(e);
            navigate("/404");
        }
    }
    useEffect(() => {
        getReview();
    }, []);

    return <Box p="4">
        <Button colorScheme={useColorModeValue("green", "gray")} onClick={() => navigate(-1)}>Back</Button>
        <Heading>Review for {name}</Heading>
        <Heading size='lg'>Rating: {rating}/5</Heading>
        <Text pt='2' fontSize='md'>
            {text}
        </Text>
    </Box>
}