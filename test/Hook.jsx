import React from "react";
import { useContext } from "react";
import { AuthContext } from "./Context.jsx";

export const useAuth = () => {
  return useContext(AuthContext);
};
