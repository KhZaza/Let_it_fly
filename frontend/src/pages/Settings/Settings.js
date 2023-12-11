import React from 'react';
import {
    Tab, TabList, TabPanel, TabPanels, Tabs, Container, useColorModeValue, Box
} from "@chakra-ui/react";
import {useNavigate} from "react-router-dom";
import AccountSettings from "../../components/SettingsForms/AccountSettings";
import {useAuth} from "../../features/Authentication/authProvider";
import SelectCar from "../../components/SettingsForms/SelectCar";
import UISettings from "../../components/SettingsForms/UISettings";


export default function () {
    const {user} = useAuth();
    console.log(user);
    return (
        <Box p="4">
            <Container>
                <Tabs variant='soft-rounded' colorScheme={useColorModeValue('green', 'gray')}>
                    <TabList>
                        <Tab>Account</Tab>
                        {user.isDriver ? <Tab>Car</Tab>: ''}
                        <Tab>Interface</Tab>
                    </TabList>
                    <TabPanels>
                        <AccountSettings user={user} />
                        {user.isDriver ? <SelectCar user={user}/>: ''}
                        <UISettings user={user} />
                    </TabPanels>
                </Tabs>
            </Container>
        </Box>
    )
}