import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../user/src/Hook.jsx";
import { useNavigate } from "react-router-dom";

const getUser = async () => {
  try {
    const response = await axios.get("http://localhost:3000/api/profile", {
      withCredentials: true,
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      return null;
    } else {
      console.error("Error in getting the user", error);
      return null;
    }
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser();
        console.log(userData);
        if (!userData) {
          navigate("/auth");
          return;
        }

        setUser(userData);
        console.log("user set in context");
      } catch (error) {
        console.error("error occured while fetching user", error);
      }
    };
    fetchUser();
  }, []);

  return <div>{JSON.stringify(user)}</div>;
};

export default Profile;
