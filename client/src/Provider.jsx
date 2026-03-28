import { AuthContext, SocketContext } from "./Context.jsx";
import { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  const getUser = async () => {
    try {
      console.log("get user called");

      const response = await axios.get("http://localhost:3000/api/profile", {
        withCredentials: true,
      });

      console.log("fetched data - ", response.data.user);

      if (!response.data.user) {
        setUser(null);
      } else {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("User not logged in", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, getUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const SocketProvider = ({ children }) => {
  console.log("Socket Provider called");
  const [serverMessage, setServerMessage] = useState([]);
  const [userSocket, setUserSocket] = useState(undefined);

  const connectSocket = async () => {
    try {
      console.log("connectSocket called");
      const response = await axios.get("http://localhost:3000/api/ws-token", {
        withCredentials: true,
      });

      const data = await response.data;

      if (!data.success) {
        console.error("Error while fetching JWT Token");
        return;
      }

      const { token } = data;

      const socket = io("http://localhost:3001", {
        auth: { token },
        withCredentials: true,
      });

      socket.on("connect", () => {
        console.log("socket connected", socket.id);
      });

      socket.on("disconnect", () => {
        console.log("socket disconnected");
      });

      setUserSocket(socket);
    } catch (err) {
      console.error("Socket connection failed", err);
    }
  };
  useEffect(() => {
    console.log("Connecting socket...");
    connectSocket();
  }, []);

  useEffect(() => {
    console.log("Attaching listeners");
    if (!userSocket) {
      console.log("Socket not found");
      return;
    }
    userSocket.on("message", (message) => {
      setServerMessage(message);
    });

    return () => {
      userSocket.off("message");
    };
  }, [userSocket]);

  const emitEvent = (event, payload) => {
    if (!userSocket) return;

    console.log("emitEvent called");
    console.log("socket emitted event- ", event, " payload - ", payload);
    userSocket.emit(event, payload);
  };
  return (
    <SocketContext.Provider
      value={{ serverMessage, emitEvent, connectSocket, userSocket }}
    >
      {children}
    </SocketContext.Provider>
  );
};
