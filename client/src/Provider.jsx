import { AuthContext, SocketContext } from "./Context.jsx";
import { useState, useEffect } from "react";
import axios from "axios";
import { socket } from "./socket.js";
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  const getUser = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/profile", {
        withCredentials: true,
      });

      if (!response.data.user) {
        setUser(null);
      }

      setUser(response.data.user);
    } catch (error) {
      console.error("User not logged in", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    //to-do make the logic handshake with the browser using cookies to restore the user data back
    console.log("yepp...");
    getUser();
  }, []);

  return (
    //to-do only load the required part where undefined user can move when user is null protect the routes from loading unesseccary things
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
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
