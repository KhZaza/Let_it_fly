import {useAuth} from "../../../features/Authentication/authProvider";
import {Box, Card, CardBody, Heading, Stack, StackDivider, Text} from "@chakra-ui/react";

export default function Hero({ text, children }) {
    const {user} = useAuth();

    return (
        <>
            <Card>
                <CardBody>
                    <Stack divider={<StackDivider />} spacing='4'>
                        <Box>
                            <Heading>Hi, {user.firstName}!</Heading>
                            <Text pt='2' fontSize='md'>
                                {text}
                            </Text>
                        </Box>
                        <Box>
                            {children}
                        </Box>
                    </Stack>
                </CardBody>
            </Card>

        </>
    )
}