import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { Link, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket.jsx";
import axios from "axios";

const HomePage = () => {
  const { user, getUser } = useAuth();
  const { connectSocket } = useSocket();
  const navigate = useNavigate();

  const logOut = async () => {
    try {
      const response = await axios.post("http://localhost:3000/auth/logout", {
        withCredentials: true,
      });
      return response.data; // { success: true/false, message: "" }
    } catch (error) {
      console.log("Error in Logging user out", error);
      return { success: false, message: "Server error" };
    }
  };

  return (
    <div>
      {user ? (
        <button
          onClick={async () => {
            const res = await logOut();

            if (res.success) {
              console.log("Logged Out");
              await getUser();
              await connectSocket();
            }
          }}
        >
          LogOut
        </button>
      ) : (
        <div>Log in first</div>
      )}
    </div>
  );
};

export default HomePage;
