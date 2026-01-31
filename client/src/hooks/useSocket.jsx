import { SocketContext } from "../Context.jsx";
import { useContext } from "react";

const useSocket = () => {
  return useContext(SocketContext);
};

export default useSocket;
