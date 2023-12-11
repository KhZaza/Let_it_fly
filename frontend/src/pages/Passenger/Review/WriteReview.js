import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  Heading,
  Select,
  Textarea,
  useColorModeValue,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";

export default function WriteReview() {
  let { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [reviewId, setReviewId] = useState("");
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm();

  const getRideState = async () => {
    // make a call to API to get rides
    try {
      const response = await axios.post(
        "http://localhost:8000/api/ride/customer/status",
        { rideId: id }
      );
      if (response.data.reviewCreated) {
        navigate(-1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    getRideState();
  }, []);

  function onSubmit(values) {
    let reviewBody = {
      rideId: id,
      stars: parseInt(values.stars),
      reviewText: values.reviewText,
    };
    const doSubmit = async (formData) => {
      try {
        const response = await axios.post(
          "http://localhost:8000/api/ride/review",
          formData
        );
        console.log("Review saved successfully", response);
        setReviewId(response.data.reviewId);
        navigate(`/review/${response.data.reviewId}`);
      } catch (error) {
        setError(error.response.data.detail);
      }
    };
    console.log(reviewBody);
    doSubmit(reviewBody);
  }

  return (
    <>
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}
      <Box p="4">
        <Button
          colorScheme={useColorModeValue("green", "gray")}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <br />
        <Heading size="lg">Write a Review</Heading>
        <br />
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl isRequired>
            <Select
              placeholder="Choose your rating for the driver out of five"
              size="lg"
              name="stars"
              id="stars"
              {...register("stars")}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </Select>
            <br />
            <Textarea
              placeholder="Enter the content for your review"
              {...register("reviewText")}
            />
            <br />
            <br />
            <Button
              colorScheme={useColorModeValue("green", "gray")}
              isLoading={isSubmitting}
              type="submit"
            >
              Submit
            </Button>
          </FormControl>
        </form>
      </Box>
    </>
  );
}
