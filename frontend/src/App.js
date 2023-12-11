import React from 'react';
import './index.css';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import { ChakraProvider, createLocalStorageManager, useColorMode } from '@chakra-ui/react'

import "./index.css";
import LetItFlyNavbar from './components/Navbar/Navbar'
import AuthenticationPage from './pages/Authentication/AuthenticationPage';
import HomePage from './pages/Home/HomePage'

import theme from './theme';
import RideList from "./pages/Driver/RideList/RideList";
import Settings from "./pages/Settings/Settings";
import { useAuth } from "./features/Authentication/authProvider";
import RiderHomePage from "./pages/Home/RiderHomePage";
import DriverHomePage from "./pages/Home/DriverHomePage";
import Reservation from "./pages/Reservation/Reservation";
import RideDirections from "./pages/Driver/RideDirections/RideDirections";
import Checkin from "./pages/Driver/Checkin/Checkin";
import RideDirectionsCustomer from "./pages/Passenger/RideDirections/RideDirections";
import RideListCustomer from "./pages/Passenger/RideList/RideList";
import EditSchedule from "./pages/Driver/EditSchedule/EditSchedule";
import RideHistoryList from "./pages/Driver/History/RideHistoryList";
import RideHistoryPassenger from "./pages/Passenger/History/RideHistoryList";
import WriteReview from "./pages/Passenger/Review/WriteReview";
import Review from "./pages/Review/Review";
import DriverReviewList from "./pages/Driver/Reviews/DriverReviewList";
import SignInPage from './pages/Authentication/SignInPage';
import SignUpPage from './pages/Authentication/SignUpPage';


function App() {
    const {user} = useAuth();
    const {colorMode, toggleColorMode} = useColorMode()
    const router = createBrowserRouter(user ? (user.isDriver ? driverRoutes : riderRoutes) : defaultRoutes);
    const colorModeManager = createLocalStorageManager('theme');

    return (
        <ChakraProvider theme={theme} colorModeManager={colorModeManager}>
            <RouterProvider router={router}/>
        </ChakraProvider>
    );
}


const defaultRoutes = [
    {
        path: "/",
        element: <LetItFlyNavbar/>,
        children: [
            {
                path: "/",
                element: <HomePage/>,
            },
            {
                path: "/sign-in",
                element: <SignInPage/>,
            },
            {
                path: "/sign-up",
                element: <SignUpPage/>,
            }
        ]
    },

];

const riderRoutes = [
    {
        path: "/",
        element: <LetItFlyNavbar/>,
        children: [
            {
                path: "/",
                element: <RiderHomePage/>,
            },
            {
                path: "/reservation",
                element: <Reservation/>,
            },
            {
                path: "/upcoming",
                element: <RideListCustomer/>,
            },
            {
                path: "/history",
                element: <RideHistoryPassenger/>,
            },
            {
                path: "/settings",
                element: <Settings/>,
            },
            {
                path: "/route/:id",
                element: <RideDirectionsCustomer/>,
            },
            {
                path: "/review/write/:id",
                element: <WriteReview/>,
            },
            {
                path: "/review/:id",
                element: <Review/>,
            },
        ]
    },
];

const driverRoutes  = [
    {
        path: "/",
        element: <LetItFlyNavbar />,
        children:  [
            {
                path: "/",
                element: <DriverHomePage />,
            },
            {
                path: "/upcoming",
                element: <RideList />,
            },
            {
                path: "/schedule",
                element: <EditSchedule/>,
            },
            {
                path: "/route/:id",
                element: <RideDirections />,
            },
            {
                path: "/history",
                element: <RideHistoryList/>,
            },
            {
                path: "/settings",
                element: <Settings />,
            },
            {
                path: "/review/:id",
                element: <Review/>,
            },
            {
                path: "/reviews",
                element: <DriverReviewList/>,
            }
        ]
    },
];


export default App;
