import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth.jsx";

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

    console.log("sendLoginData fetched response is - ", response.data);

    return response.data;
  } catch (error) {
    console.log("error in sending login data ", error);
  }
};
const Login = () => {
  const navigate = useNavigate();
  const { getUser } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  return (
    <div>
      <h2>Login</h2>
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

          await getUser();

          navigate("/profile");
        }}
      >
        submit
      </button>
    </div>
  );
};

export default Login;
