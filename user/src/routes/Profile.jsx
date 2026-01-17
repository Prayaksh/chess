import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";

const getUser = async () => {
  try {
    const response = await axios.get("http://localhost:3000/api/profile", {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error("Error is getting the user", error);
  }
};

const Profile = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser();
        if (!userData) {
          console.error("error while getting the userdata");
          return;
        }

        setUser((pre) => ({
          ...pre,
          ...userData,
        }));
      } catch (error) {
        console.error("error occured while fetching user", error);
      }
    };
    fetchUser();
  }, []);

  return <div>{JSON.stringify(user)}</div>;
};

export default Profile;
