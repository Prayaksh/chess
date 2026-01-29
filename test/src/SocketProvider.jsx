import { useState, useEffect, createContext, useContext } from "react";

import { socket } from "./main.js";

const SocketContext = createContext();

//provide the data recieved and provide the method to send events
const SocketProvider = ({ children }) => {
  const [serverMessage, setServerMessage] = useState([]);

  useEffect(() => {
    if (!socket) return;
    socket.on("message", (message) => {
      setServerMessage(message);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  const emitEvent = (event, payload) => {
    console.log("emitEvent called");
    socket.emit(event, payload);
    console.log("socket emitted event- ", event, " payload - ", payload);
  };
  return (
    <SocketContext.Provider value={{ serverMessage, emitEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;

export const useSocket = () => useContext(SocketContext);
