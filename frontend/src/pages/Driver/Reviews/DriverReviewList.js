import {useAuth} from "../../../features/Authentication/authProvider";
import ReviewList from "../../../components/ReviewList/ReviewList";
import React from "react";
import {Box, useBreakpointValue} from "@chakra-ui/react";

export default function DriverReviewList() {
    const {user} = useAuth();
    const mapHeight = useBreakpointValue({base: "md", sm: 'sm', lg: "xl"}, {ssr: false});
    return <Box p="4">
        <ReviewList id={user.user_id} size={mapHeight}/>
    </Box>
}