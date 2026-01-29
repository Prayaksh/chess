import React from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { Navigate } from "react-router-dom";

const ProtectedRoutes = ({ children }) => {
  const { user } = useAuth();
  console.log("user in protected route", user);
  if (!user) {
    console.log("user null moving to login");
    return <Navigate to={"/login"} replace />;
  }
  return children;
};

export default ProtectedRoutes;
