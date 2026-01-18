import { useState, useEffect } from "react";
import { AuthContext } from "./Context.jsx";
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    console.log("AuthProvider mounted");
    return () => console.log("AuthProvider UNMOUNTED!");
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
