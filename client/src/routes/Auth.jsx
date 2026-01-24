import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
const sendLoginData = async ({ email, password }) => {
  try {
    const response = await axios.post(
      "http://localhost:3000/auth/login",
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
    <div>
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
      <button
        onClick={() => {
          navigate("/");
        }}
      >
        Move to home
      </button>
    </div>
  );
};

export default Auth;
