import React, {useState} from 'react';
import {
    Heading,
    useColorModeValue,
    Button,
    Input,
    Badge,
    Text,
    FormControl, FormLabel, Fade, Alert, AlertIcon, TabPanel
} from "@chakra-ui/react";
import axios from 'axios';
import {Outlet, useNavigate} from "react-router-dom";
import {useAuth} from "../../features/Authentication/authProvider";
import {useForm} from "react-hook-form";

export default function AccountSettings() {
    const navigate = useNavigate();
    const {
        user,
        token,
        setUser
    } = useAuth();
    const {
        handleSubmit,
        register,
        formState: {errors, isSubmitting},
    } = useForm();
    const [error, setError] = useState(null);
    const savePassword = async (values) => {
        try {
            const response = await axios.post('http://localhost:8000/change_password', values);
            console.log('Password saved successfully', response);
            if (response.data?.success === false) {

                setError(<Alert status='error'>
                    <AlertIcon/>
                    {response.data?.errorMessage}
                </Alert>)
            } else {
                setError(<Alert status='success'>
                    <AlertIcon/>
                    Password Changed Successfully
                </Alert>);
            }
        } catch (err) {
            console.error('Error saving password', err);
        }
    };
    const saveUserInfo = async (values) => {
        console.log(values);
        try {
            // Send the password to API endpoint
            const response = await axios.post('http://localhost:8000/change_user_info', values);
            console.log('User details changed', response);
            if (response.data?.success === false) {
                setError(<Alert status='error'>
                    <AlertIcon/>
                    {response.data?.errorMessage}
                </Alert>)
            } else {
                setUser(token)
                setError(<Alert status='success'>
                    <AlertIcon/>
                    User details changed successfully
                </Alert>);
            }
        } catch (err) {
            console.error('Error saving user info', err);
        }
    };

    return (
        <TabPanel>
            <Heading>{user.firstName} {user.lastName}'s Account<Badge ml='2'
                                                                      colorScheme={user.isDriver ? 'green' : 'blue'}>{user.isDriver ? 'Driver' : 'Rider'}</Badge></Heading>
            <br/>
            {error ? (
                <>
                    <Fade in={error}>
                        {error}
                    </Fade>
                    <br/>
                </>
            ) : (<></>)
            }
            <form onSubmit={handleSubmit(saveUserInfo)}>
                <FormControl isRequired>
                    <FormLabel htmlFor='new_first_name'>First Name</FormLabel>
                    <Input placeholder={user.firstName} id="new_first_name" size='lg' {...register('new_first_name')}
                           bg={useColorModeValue("white", "gray.900")}/>
                    <FormLabel htmlFor='new_last_name'>Last Name</FormLabel>
                    <Input placeholder={user.lastName} id="new_last_name" size='lg' {...register('new_last_name')}
                           bg={useColorModeValue("white", "gray.900")}/>
                </FormControl>
                <br/>
                <Button
                    colorScheme={useColorModeValue("green", "gray")}
                    isLoading={isSubmitting}
                    type="submit"
                >
                    Change Name
                </Button>
            </form>
            <br/>
            <br/>
            <Heading size='lg'>Change Password</Heading>
            <br/>
            <form onSubmit={handleSubmit(savePassword)}>
                <FormControl isRequired>
                    <FormLabel htmlFor='new_password'>Password</FormLabel>
                    <Input
                        type="password"
                        bg={useColorModeValue("white", "gray.900")}
                        id="new_password"
                        {...register('new_password')}
                    />
                </FormControl>
                <br/>
                <FormControl isRequired>
                    <FormLabel htmlFor='confirm_new_password'>Repeat Password</FormLabel>
                    <Input
                        type="password"
                        bg={useColorModeValue("white", "gray.900")}
                        id="confirm_new_password"
                        {...register('confirm_new_password')}
                    />

                </FormControl>
                <br/>
                <Button
                    colorScheme={useColorModeValue("green", "gray")}
                    isLoading={isSubmitting}
                    type="submit"
                >
                    Change Password
                </Button>

            </form>
        </TabPanel>
    )
}