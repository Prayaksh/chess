import React from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNavigate } from "react-router-dom";

const TestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div>
      Test Page
      <h1>User is = {user?.provider}</h1>
      <button
        onClick={() => {
          navigate("/");
        }}
      >
        Move to Home
      </button>
    </div>
  );
};

export default TestPage;
