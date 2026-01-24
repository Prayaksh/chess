import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { Link, useNavigate } from "react-router-dom";

const HomePage = () => {
  const { user } = useAuth();

  const navigate = useNavigate();
  return (
    <div>
      <h1>the user is {user?.provider}</h1>
      <button
        onClick={() => {
          navigate("/test");
        }}
      >
        Move to Test
      </button>
      <button
        onClick={() => {
          navigate("/login");
        }}
      >
        Move to Auth
      </button>
    </div>
  );
};

export default HomePage;
