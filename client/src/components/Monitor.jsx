import React from "react";
import { useSocket } from "../hooks/useSocket.jsx";

const Monitor = () => {
  const { serverMessage } = useSocket();
  return <div>{JSON.stringify(serverMessage, null, 2)}</div>;
};

export default Monitor;
