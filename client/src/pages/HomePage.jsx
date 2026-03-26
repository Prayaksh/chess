import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { Link, useNavigate } from "react-router-dom";

const HomePage = () => {
  const { user } = useAuth();
  console.log("user from useAuth in homepage -", user);

  const navigate = useNavigate();
  return (
    <div>
      <h1>the user is {user?.userId}</h1>
      <button
        onClick={() => {
          console.log("moving to test");
          navigate("/test");
        }}
      >
        Move to Test
      </button>
      <button
        onClick={() => {
          console.log("moving to login");

          navigate("/login");
        }}
      >
        Move to Auth
      </button>
      <button
        onClick={() => {
          console.log("moving to game");

          navigate("/game");
        }}
      >
        Move to Game
      </button>
    </div>
  );
};

export default HomePage;
