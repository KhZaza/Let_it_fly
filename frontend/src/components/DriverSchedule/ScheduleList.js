import React, {useState} from 'react';
import {
    TabPanel, Heading, Button
} from "@chakra-ui/react";
import ScheduleBlock from "./ScheduleBlock";
import axios from "axios";
import {Link} from "react-router-dom";


export default function ({day, scheduleList, fetchData}) {
    const [newBlock, setNewBlock] = useState(false)
    const submitChange = (id, start, end) => {
        setNewBlock(!newBlock);
        const validation = (start, end) => {
            return true;
        };

        if (validation(start, end)) {
            console.log({"scheduleId": id, "day": day.toUpperCase(), "startTime": start, "endTime": end});

            axios.post(
                'http://localhost:8000/api/driver/schedule/edit',
                {"scheduleId": id, "day": day.toUpperCase(), "startTime": start, "endTime": end}
            )
                .then((data) => {
                    console.log(data);
                    fetchData()
                })
                .catch((error) => console.log(error))
                .finally();
        }
        fetchData()
    };

    const renderSchedule = scheduleList.filter((block) => "dayOfWeek" in block && block.dayOfWeek === day.toUpperCase())

    return (
        <TabPanel>
            <Heading>{day}</Heading>
            <br/>
            {renderSchedule.map((block => <ScheduleBlock key={block.id} day={block.dayOfWeek} id={block.id}
                                                         start={block.startTime}
                                                         end={block.endTime} sendUpdate={submitChange}
                                                         fetchData={fetchData}/>))}
            {(newBlock) ?
                <ScheduleBlock day={day} id={null} start={''} end={''} sendUpdate={submitChange}
                               fetchData={fetchData}/> :
                <Button colorScheme="blue" onClick={() => setNewBlock(true)}>
                    + New Block
                </Button>}
        </TabPanel>
    )
}