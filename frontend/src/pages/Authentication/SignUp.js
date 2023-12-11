import { Controller, useForm } from "react-hook-form";
import axios from "axios";

import {
  FormErrorMessage,
  FormLabel,
  FormControl,
  Input,
  Button,
  useColorModeValue,
  FormHelperText,
  RadioGroup,
  HStack,
  Radio,
  Fade,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import React, { useState } from "react";

import { useAuth } from "../../features/Authentication/authProvider";
import { useNavigate } from "react-router-dom";
import { sendTokenRequest } from "./SignIn";
export default function SignUp() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();
  const [error, setError] = useState(null);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    control,
  } = useForm();

  function onSubmit(values) {
    console.log(values);
    const regBody = {
      email: values.email,
      password: values.password,
      isDriver: values.account_type === "driver",
      firstName: values.firstName,
      lastName: values.lastName,
    };
    console.log(regBody);
    axios({
      url: "http://localhost:8000/register",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: regBody,
    })
      .then((res) => {
        if (res.data.success) {
          sendTokenRequest(
            values.email,
            values.password,
            (res) => {
              if ("access_token" in res.data) {
                // update session to have user data
                setToken(res.data.access_token);
                setUser(res.data.access_token);
                // redirect back to home screen
                navigate("/", { replace: true });
              } else {
                setError(res.data.detail);
              }
            },
            (err) => {
              setError(err.response.data.detail);
            }
          );
        } else {
          setError(res.data.errorMessage);
        }
      })
      .catch((err) => {
        setError(err.response.data.detail);
      });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isRequired>
        <FormLabel>Email address</FormLabel>
        <Input
          type="email"
          bg={useColorModeValue("white", "gray.900")}
          id="email"
          {...register("email", {
            required: "required",
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Entered value does not match email format",
            },
          })}
        />
        <FormHelperText>Your email address must be unique.</FormHelperText>
      </FormControl>
      <br />
      <FormControl isRequired>
        <FormLabel>First Name</FormLabel>
        <Input
          type="text"
          bg={useColorModeValue("white", "gray.900")}
          id="firstName"
          {...register("firstName")}
        />
        <FormHelperText>Please enter your first name.</FormHelperText>
      </FormControl>
      <br />
      <FormControl isRequired>
        <FormLabel>Last Name</FormLabel>
        <Input
          type="text"
          bg={useColorModeValue("white", "gray.900")}
          id="lastName"
          {...register("lastName")}
        />
        <FormHelperText>Please enter your last name.</FormHelperText>
      </FormControl>
      <br />
      <FormControl isRequired>
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          bg={useColorModeValue("white", "gray.900")}
          id="password"
          {...register("password")}
        />
      </FormControl>
      <br />
      <FormControl as="fieldset" isRequired>
        <FormLabel as="legend">I am a</FormLabel>
        <Controller
          name="account_type"
          control={control}
          defaultValue="rider"
          render={({ field: { onChange, value } }) => (
            <RadioGroup
              defaultValue="rider"
              name="account_type"
              onChange={onChange}
              value={value}
            >
              <HStack spacing="24px">
                <Radio value="rider">Rider</Radio>
                <Radio value="driver">Driver</Radio>
              </HStack>
            </RadioGroup>
          )}
        />
        {error ? (
          <>
            <Fade in={error}>
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            </Fade>
          </>
        ) : (
          <></>
        )}
      </FormControl>
      <br />
      <Button
        colorScheme={useColorModeValue("green", "gray")}
        isLoading={isSubmitting}
        type="submit"
      >
        Sign Up
      </Button>
    </form>
  );
}
