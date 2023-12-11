import React, {useEffect, useState} from 'react';
import {
    Tab, TabList, TabPanel, TabPanels, Tabs, Container, useColorModeValue, Box
} from "@chakra-ui/react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../../features/Authentication/authProvider";
import ScheduleList from "../../../components/DriverSchedule/ScheduleList";
import axios from "axios";


export default function () {
    const [schedule, setSchedule] = useState([]);
    const {user} = useAuth();

    const fetchData = async () => {
        try {
            const response = await axios.post(
                'http://localhost:8000/api/driver/schedule/retrieve',
                {"driverId": user.user_id}
            );
            if ("schedule" in response.data) {
                setSchedule(response.data.schedule);
            } else {
                console.error("schedule not retrieved in response: " + response.data);
            }
        } catch (error) {
            console.error('Error while fetching car data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user.user_id]);

    return (
        <Box p="4">
            <Container>
                <Tabs variant='soft-rounded' colorScheme={useColorModeValue('green', 'gray')}>
                    <TabList>
                        <Tab>Sunday</Tab>
                        <Tab>Monday</Tab>
                        <Tab>Tuesday</Tab>
                        <Tab>Wednesday</Tab>
                        <Tab>Thursday</Tab>
                        <Tab>Friday</Tab>
                        <Tab>Saturday</Tab>
                    </TabList>
                    <TabPanels>
                        <ScheduleList day={"Sunday"} scheduleList={schedule} fetchData={fetchData}/>
                        <ScheduleList day={"Monday"} scheduleList={schedule} fetchData={fetchData}/>
                        <ScheduleList day={"Tuesday"} scheduleList={schedule} fetchData={fetchData}/>
                        <ScheduleList day={"Wednesday"} scheduleList={schedule} fetchData={fetchData}/>
                        <ScheduleList day={"Thursday"} scheduleList={schedule} fetchData={fetchData}/>
                        <ScheduleList day={"Friday"} scheduleList={schedule} fetchData={fetchData}/>
                        <ScheduleList day={"Saturday"} scheduleList={schedule} fetchData={fetchData}/>
                    </TabPanels>
                </Tabs>
            </Container>
        </Box>
    )
}