import { Stack, Flex, Button, Text, VStack, useBreakpointValue } from '@chakra-ui/react'
import React from "react";
import {Link} from "react-router-dom";


export default function Hero() {
    return (
        <Flex
            w={'full'}
            h={'100vh'}
            backgroundImage={
                "url(https://images.unsplash.com/photo-1602307553127-679bd398cd60?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80)"
            }
            backgroundSize={'cover'}
            backgroundPosition={'center center'}>
            <VStack
                w={'full'}
                justify={'center'}
                px={useBreakpointValue({ base: 4, md: 8 })}
                bgGradient={'linear(to-r, blackAlpha.600, transparent)'}>
                <Stack maxW={'2xl'} align={'flex-start'} spacing={6}>
                    <Text
                        color={'white'}
                        fontWeight={700}
                        lineHeight={1.2}
                        fontSize={useBreakpointValue({ base: '3xl', md: '4xl' })}>
                        Let's get you to where you're going
                    </Text>
                    <Stack direction={'row'}>
                        <Link to="/sign-in">
                            <Button
                            bg={'blue.400'}
                            rounded={'full'}
                            color={'white'}
                            _hover={{ bg: 'blue.500' }}>
                            Sign In
                        </Button>
                        </Link>
                        <Link to="/sign-up">
                            <Button
                            bg={'whiteAlpha.300'}
                            rounded={'full'}
                            color={'white'}
                            _hover={{ bg: 'whiteAlpha.500' }}>
                            Sign Up
                        </Button>
                        </Link>
                    </Stack>
                </Stack>
            </VStack>
        </Flex>
    )
}