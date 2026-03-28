import { SocketContext } from "../Context.jsx";
import { useContext } from "react";

export const useSocket = () => {
  return useContext(SocketContext);
};
