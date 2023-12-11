import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  HStack,
  Spinner,
  Stack,
  StackDivider,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReviewList from "../ReviewList/ReviewList";

export default function DriverStep({
  isResultsLoaded,
  driverResults,
  setSelectedDriver,
  nextStep,
  isDriverPicked
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [driverReviewId, setDriverReviewId] = useState("");


  useEffect(() => {
    if (isDriverPicked) {
        nextStep()
    }
  }, [isDriverPicked])

  if (!isResultsLoaded) {
    return (
      <Box>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Box>
    );
  }
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setDriverReviewId("");
        }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reviews</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <ReviewList id={driverReviewId} />
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => {
                onClose();
                setDriverReviewId("");
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Box>
        <VStack spacing={2}>
          {driverResults.map((e, index) => (
            <Box minW={"100%"}>
              <Card key={e.driverId} size="sm" variant="outline">
                <div onClick={() => setSelectedDriver(e)}>
                  <CardHeader>
                    <Heading size="md">
                      {e.firstName} {e.lastName}{" "}
                      <Badge ml="2" colorScheme="green">
                        {e.car.carType}
                      </Badge>
                    </Heading>
                  </CardHeader>

                  <CardBody>
                    <Stack divider={<StackDivider />} spacing="4">
                      <Box>
                        <Heading size="xs" textTransform="uppercase">
                          Car
                        </Heading>
                        <Text pt="2" fontSize="sm">
                          <Text>
                            {e.car.carManufacturer} {e.car.carName}
                          </Text>
                        </Text>
                      </Box>
                    </Stack>
                  </CardBody>
                </div>
                <CardFooter>
                  <HStack>
                    <Heading size="md">{e.rating}/5</Heading>
                    <Button
                      onClick={() => {
                        setDriverReviewId(e.driverId);
                        onOpen();
                      }}
                    >
                      View Reviews
                    </Button>
                    <Button onClick={() => setSelectedDriver(e)}>Select</Button>
                  </HStack>
                </CardFooter>
              </Card>
            </Box>
          ))}
        </VStack>
      </Box>
    </>
  );
}
