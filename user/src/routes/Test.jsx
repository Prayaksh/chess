import React from "react";
import { useAuth } from "../Hook.jsx";

const Test = () => {
  const { user, setUser } = useAuth();

  console.log("user in test ", user);
  return <div>{JSON.stringify(user, null, 2)}</div>;
};

export default Test;
