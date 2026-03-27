import { useNavigate } from "react-router-dom";

import Login from "../components/Login.jsx";
import Signup from "../components/Signup.jsx";

const Auth = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div>
        <Login />
        <Signup />
      </div>

      <button
        onClick={() => {
          console.log("Moving to external redirect /auth/google");
          window.location.href = "/auth/google";
          //automatically redirects to /profile
        }}
      >
        Login with google
      </button>
      <button
        onClick={() => {
          console.log("Moving to external redirect /auth/github");

          window.location.href = "/auth/github";
          //automatically redirects to /profile
        }}
      >
        Login with github
      </button>
      <button
        onClick={() => {
          console.log("moving to home");
          navigate("/");
        }}
      >
        Move to home
      </button>
    </div>
  );
};

export default Auth;
