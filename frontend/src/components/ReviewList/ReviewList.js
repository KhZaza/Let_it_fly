import React, {useEffect, useState} from "react";
import {Box, Card, CardBody, CardHeader, Heading, Text, VStack} from "@chakra-ui/react";
import axios from "axios";

export function ReviewTag({rating, text, size}) {
    return <Box minW={size}>
        <Card variant='outline'>
            <CardHeader>
                <Heading size='md'>Rating: {rating}/5</Heading>
            </CardHeader>
            <CardBody>
                <Text pt='2' fontSize='md'>
                    {text}
                </Text>
            </CardBody>
        </Card>
    </Box>
}

export default function ReviewList({id, size = "sm"}) {
    const [reviewList, setReviewList] = useState([]);
    const [average, setAverage] = useState(0);
    const getReview = async () => {
        // make a call to API to get rides
        try {
            const response = await axios.post('http://localhost:8000/api/ride/review/driver', {'driverId': id});
            setReviewList(response.data?.reviews)
            setAverage(response.data?.reviewAvg)
        } catch (e) {
            console.error(e);
        }
    }
    useEffect(() => {
        getReview();
    }, [id]);
    return <Box>
        <Heading size='md'>Average Rating: {average}/5</Heading>
        <VStack spacing={2}>
            {reviewList.map((element, index) => <ReviewTag key={index} rating={element.reviewStars}
                                                           text={element.reviewBody} size={size}/>)}
        </VStack>
    </Box>
}