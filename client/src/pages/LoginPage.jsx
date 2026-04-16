import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth.jsx";
import { useSocket } from "../hooks/useSocket.jsx";

const sendLoginData = async ({ email, password }) => {
  try {
    const response = await axios.post(
      "http://localhost:3000/auth/login",
      { email, password },
      { withCredentials: true },
    );
    return response.data; // { success: true/false, message: "" }
  } catch (error) {
    console.log("Error in sending login data", error);
    return { success: false, message: "Server error" };
  }
};

const sendSignupData = async ({ email, password, name }) => {
  try {
    const response = await axios.post(
      "http://localhost:3000/auth/signup",
      { email, password, name },
      { withCredentials: true },
    );
    return response.data; // { success: true/false, message: "" }
  } catch (error) {
    console.log("Error in sending signup data", error);
    return { success: false, message: "Server error" };
  }
};

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { getUser } = useAuth();
  const { connectSocket } = useSocket();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let res;
    if (isSignup) {
      res = await sendSignupData(form);
    } else {
      res = await sendLoginData(form);
    }

    setLoading(false);

    if (res.success) {
      await getUser();
      await connectSocket();
      navigate("/profile");
    } else {
      setError(res.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text-primary px-4">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-border">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-wide mb-1 sm:mb-2">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>

        <p className="text-xs sm:text-sm text-text-secondary mb-5 sm:mb-6">
          {isSignup ? "Sign up to get started" : "Login to your account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {isSignup && (
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-surface-2 border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-text-secondary"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-surface-2 border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-text-secondary"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-surface-2 border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-text-secondary"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 rounded-lg bg-text-primary text-bg font-medium shadow-md hover:opacity-90 transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Processing..." : isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs text-text-secondary">or continue with</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <div className="space-y-3">
          <button
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg bg-surface-2 border border-border text-text-primary hover:bg-surface-hover transition active:scale-[0.98]"
            onClick={() => (window.location.href = "/auth/google")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <button
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg bg-surface-2 border border-border text-text-primary hover:bg-surface-hover transition active:scale-[0.98]"
            onClick={() => (window.location.href = "/auth/github")}
          >
            <svg
              version="1.0"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 240 240"
              preserveAspectRatio="xMidYMid meet"
            >
              <g
                transform="translate(0,240) scale(0.1,-0.1)"
                fill="#fffefe"
                stroke="none"
              >
                <path d="M970 2301 c-305 -68 -555 -237 -727 -493 -301 -451 -241 -1056 143 -1442 115 -116 290 -228 422 -271 49 -16 55 -16 77 -1 24 16 25 20 25 135 l0 118 -88 -5 c-103 -5 -183 13 -231 54 -17 14 -50 62 -73 106 -38 74 -66 108 -144 177 -26 23 -27 24 -9 37 43 32 130 1 185 -65 96 -117 133 -148 188 -160 49 -10 94 -6 162 14 9 3 21 24 27 48 6 23 22 58 35 77 l24 35 -81 16 c-170 35 -275 96 -344 200 -64 96 -85 179 -86 334 0 146 16 206 79 288 28 36 31 47 23 68 -15 36 -11 188 5 234 13 34 20 40 47 43 45 5 129 -24 214 -72 l73 -42 64 15 c91 21 364 20 446 0 l62 -16 58 35 c77 46 175 82 224 82 39 0 39 -1 55 -52 17 -59 20 -166 5 -217 -8 -30 -6 -39 16 -68 109 -144 121 -383 29 -579 -62 -129 -193 -219 -369 -252 l-84 -16 31 -55 32 -56 3 -223 4 -223 25 -16 c23 -15 28 -15 76 2 80 27 217 101 292 158 446 334 590 933 343 1431 -145 293 -419 518 -733 602 -137 36 -395 44 -525 15z" />
              </g>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <p className="text-xs sm:text-sm text-text-secondary mt-5 sm:mt-6 text-center">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="ml-1.5 sm:ml-2 text-text-primary hover:underline"
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
