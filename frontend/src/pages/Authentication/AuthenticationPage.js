import React, { useState } from 'react';
import {
    Tab, TabList, TabPanel, TabPanels, Tabs, Container, useColorModeValue, Box
} from "@chakra-ui/react";
import {useNavigate} from "react-router-dom";

import SignIn from './SignIn';
import SignUp from './SignUp';

export default function ({requestedIndex=0}) {
    let navigate = useNavigate();
    const setTabIndex = (index) => {
        navigate(index === 0 ? '/sign-in' : '/sign-up');
    }

    return (
        <Box p="4">
            <Container>
                <Tabs variant='soft-rounded' colorScheme={useColorModeValue('green', 'gray')} defaultIndex={requestedIndex} onChange={(index) => setTabIndex(index)}>
                    <TabList>
                        <Tab>Sign In</Tab>
                        <Tab>Sign Up</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <SignIn/>
                        </TabPanel>
                        <TabPanel>
                            <SignUp/>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Container>
        </Box>
    )
}