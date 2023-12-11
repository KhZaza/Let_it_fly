import {
    Text,
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Heading
} from "@chakra-ui/react";
import React from "react";
import {Link} from "react-router-dom";

export default function ReviewTag({isReviewed, reviewId, id}) {
    if (isReviewed) {
        return <Card>
            <CardHeader>
                <Heading size='md'>Review Written</Heading>
            </CardHeader>
            <CardBody>
                <Text>Thank you for your feedback!</Text>
            </CardBody>
            <CardFooter>
                <Link to={`/review/${reviewId}`}><Button>View</Button></Link>
            </CardFooter>
        </Card>
    } else {
        return <Card>
            <CardHeader>
                <Heading size='md'>Review Not Written</Heading>
            </CardHeader>
            <CardBody>
                <Text>Please provide feedback on your experience</Text>
            </CardBody>
            <CardFooter>
                <Link to={`/review/write/${id}`}><Button>Write Review</Button></Link>
            </CardFooter>
        </Card>
    }

}