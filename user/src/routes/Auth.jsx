import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
const sendLoginData = async ({ email, password }) => {
  try {
    const response = await axios.post(
      "http://Localhost:3000/auth/login",
      {
        email: email,
        password: password,
      },
      { withCredentials: true },
    );

    return response.data;
  } catch (error) {
    console.log("error in sending login data ", error);
  }
};

const Auth = () => {
  const [user, setUser] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  return (
    <div id="login-form">
      <input
        type="email"
        name="email"
        placeholder="narendra.modi@gmail.com"
        value={user.email}
        onChange={(e) => setUser({ ...user, [e.target.name]: e.target.value })}
      />
      <input
        type="password"
        name="password"
        placeholder="password"
        value={user.password}
        onChange={(e) => setUser({ ...user, [e.target.name]: e.target.value })}
      />

      <button
        onClick={async () => {
          const { success } = await sendLoginData(user);
          if (!success) {
            console.error("error while posting the user data");
            return;
          }

          navigate("/profile");
        }}
      >
        submit
      </button>

      <button
        onClick={() => {
          window.location.href = "/auth/google";
          //automatically redirects to /profile
        }}
      >
        Login with google
      </button>
      <button
        onClick={() => {
          window.location.href = "/auth/github";
          //automatically redirects to /profile
        }}
      >
        Login with github
      </button>
    </div>
  );
};

export default Auth;
