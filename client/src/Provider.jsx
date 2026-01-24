import { AuthContext } from "./Context.jsx";
import { useState, useEffect } from "react";
import axios from "axios";
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const getUser = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/profile");

      if (!response.data.user) {
        setUser(null);
      }

      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    //to-do make the logic handshake with the browser using cookies to restore the user data back
    getUser();
  }, []);

  return (
    //to-do only load the required part where undefined user can move when user is null protect the routes from loading unesseccary things
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
