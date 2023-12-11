import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    // State to hold the authentication token
    const [token, setToken_] = useState(localStorage.getItem("token"));

    // state to hold user object if logged in
    const [user, setUser_] = useState(JSON.parse(localStorage.getItem('user')));

    // function to retrieve user details based on token
    const setUser = (newToken) => {
        if (newToken) {
            // call API for user details
            axios({
                url: "http://localhost:8000/api/users/me",
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + newToken
                },
            }).then((res) => {
                // set user in state and storage
                if ('user_id' in res.data) {
                    setUser_(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            // token deleted, remove user
            setUser_(null)
            localStorage.removeItem('token');
        }
    }


    // Function to set the authentication token
    const setToken = (newToken) => {
        setToken_(newToken);
        // set user data for app to retrieve
    };


    useEffect(() => {
        if (token) {
            // set token to be passed in authorization
            axios.defaults.headers.common["Authorization"] = "Bearer " + token;
            localStorage.setItem('token',token);
            // decode the JWT time section
            let decodedJwt = JSON.parse(atob(token.split(".")[1]))
            // check if expiration time is past current date
            if (decodedJwt.exp * 1000 < Date.now()) {
                console.log('Credentials out of sync');
                // remove token
                delete axios.defaults.headers.common["Authorization"];
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userLoggedInTime');
                setUser_(null);
                setToken(null);
            }
        } else {
            delete axios.defaults.headers.common["Authorization"];
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userLoggedInTime');
            setUser_(null)
        }
    }, [token, user]);

    // Memoized value of the authentication context
    const contextValue = useMemo(
        () => ({
            token,
            setToken,
            user,
            setUser
        }),
        [token, user]
    );

    // Provide the authentication context to the children components
    return (
        <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthProvider;
