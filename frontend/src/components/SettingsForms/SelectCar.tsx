import React, { useEffect, useState } from "react";
import {
  TabPanel,
  Text,
  Button,
  Select,
  Input,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import axios from "axios";
import { useAuth } from "../../features/Authentication/authProvider";

interface CarFormData {
  carId: string;
  name: string;
  manufacturer: string;
  carType: string;
}

const initialFormData: CarFormData = {
  carId: "",
  name: "",
  manufacturer: "",
  carType: "",
};
export default function CarForm({ user }) {
  const { token } = useAuth();
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState<CarFormData>(initialFormData);
  console.log(formData);
  useEffect(() => {
    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    console.log(formData);
    const fetchData = async () => {
      try {
        const response = await axios.post(
          "http://localhost:8000/api/car/retrieve",
          {}
        );
        console.log("Car data retrieved", response.data);

        let newFormData: CarFormData = {
          carId: response.data.car_id,
          name: response.data.car_name,
          manufacturer: response.data.car_manufacturer,
          carType: response.data.car_type,
        };
        setFormData(newFormData);
      } catch (error) {
        setError("Error: " + error.response.data.detail);
        console.error("Error while fetching car data:", error);
      }
    };

    fetchData();
  }, []);

  const saveCar = async () => {
    // Validation
    let isValid =
      formData.carId &&
      formData.carType &&
      formData.name &&
      formData.manufacturer &&
      ["SEDAN", "SUV", "CARGO"].includes(formData.carType);

    if (!isValid) {
      setError(
        "Please complete all car fields and select a valid car type before submitting."
      );
    } else {
      try {
        const response = await axios.post(
          "http://localhost:8000/api/car/edit",
          formData
        );
        console.log("Car data saved successfully", response);
        setError(null);
      } catch (error) {
        setError("There was an error saving the car to Let if Fly services");
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <TabPanel>
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Text mt="2">Car Name</Text>
      <Input
        placeholder="My Car"
        size="lg"
        name="name"
        onChange={handleInputChange}
        value={formData.name}
      />
      <Text mt="2">Car Manufacturer</Text>
      <Input
        placeholder="Costi Cars Inc."
        size="lg"
        name="manufacturer"
        onChange={handleInputChange}
        value={formData.manufacturer}
      />
      <Text mt="2">Car Type</Text>
      <Select
        placeholder="Choose Type"
        size="lg"
        name="carType"
        onChange={handleInputChange}
        value={formData.carType}
      >
        <option value="SEDAN">Sedan</option>
        <option value="SUV">SUV</option>
        <option value="CARGO">Cargo</option>
      </Select>
      <Button colorScheme="teal" size="md" mt="2" onClick={saveCar}>
        Save
      </Button>
    </TabPanel>
  );
}
