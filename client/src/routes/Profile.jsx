import React from "react";
import { useAuth } from "../hooks/useAuth.jsx";

const Profile = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1>successfully logged in {user?.provider}</h1>
    </div>
  );
};

export default Profile;
