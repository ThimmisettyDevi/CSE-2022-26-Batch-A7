import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import React from "react";


const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  console.log(user);
  
  return user ? children : <Navigate to="/" />;
};

export default PrivateRoute;
