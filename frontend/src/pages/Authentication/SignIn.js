import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  Fade,
  FormLabel,
  FormControl,
  Input,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import React, { useState } from "react";

import { useAuth } from "../../features/Authentication/authProvider";

export function sendTokenRequest(username, password, callback, errorHandler) {
  let submitFormData = new FormData();
  submitFormData.append("grant_type", "password");
  submitFormData.append("username", username);
  submitFormData.append("password", password);
  axios({
    url: "http://localhost:8000/token",
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: submitFormData,
  })
    .then(callback)
    .catch(errorHandler);
}
export default function SignIn() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();
  const [error, setError] = useState(null);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm();
  console.log(error);

  function onSubmit(values) {
    sendTokenRequest(
      values.username,
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
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isRequired>
        <FormLabel htmlFor="username">Email address</FormLabel>
        <Input
          type="email"
          bg={useColorModeValue("white", "gray.900")}
          id="username"
          {...register("username", {
            required: "required",
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Entered value does not match email format",
            },
          })}
        />
      </FormControl>
      <br />
      <FormControl isRequired>
        <FormLabel htmlFor="password">Password</FormLabel>
        <Input
          type="password"
          bg={useColorModeValue("white", "gray.900")}
          id="password"
          {...register("password")}
        />
      </FormControl>
      <br />
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
      <br />
      <Button
        colorScheme={useColorModeValue("green", "gray")}
        isLoading={isSubmitting}
        type="submit"
      >
        Sign In
      </Button>
    </form>
  );
}
