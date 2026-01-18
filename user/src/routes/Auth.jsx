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
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  return (
    <div id="login-form">
      <input
        type="email"
        name="email"
        placeholder="narendra.modi@gmail.com"
        value={formData.email}
        onChange={(e) =>
          setFormData({ ...formData, [e.target.name]: e.target.value })
        }
      />
      <input
        type="password"
        name="password"
        placeholder="password"
        value={formData.password}
        onChange={(e) =>
          setFormData({ ...formData, [e.target.name]: e.target.value })
        }
      />

      <button
        onClick={async () => {
          const { success } = await sendLoginData(formData);
          if (!success) {
            console.error("error while posting the formData data");
            return;
          }

          navigate("/profile");
        }}
      >
        submit
      </button>

      <button
        onClick={() => {
          navigate("/auth/google");
          //automatically redirects to /profile
        }}
      >
        Login with google
      </button>
      <button
        onClick={() => {
          navigate("/auth/github");
          //automatically redirects to /profile
        }}
      >
        Login with github
      </button>
    </div>
  );
};

export default Auth;
