import {Button, Select, TabPanel, Text, useColorMode} from "@chakra-ui/react";
import axios from "axios";
import {useState} from "react";

export default function UISettings({ user }) {
    const { colorMode, toggleColorMode } = useColorMode()

    return (
        <TabPanel>
            <Button onClick={toggleColorMode}>
                Toggle {colorMode === 'light' ? 'Dark' : 'Light'}
            </Button>
        </TabPanel>
    )
}