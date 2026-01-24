import { Router } from "express";
export const authRouter = Router();
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    //add this to the database and move to the profile

    req.session.user = {
      name: email,
      email: email,
      provider: "login",
    };

    if (req.session.user) {
      res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error("error creating user");
    res.status(500).json({ success: false, error: "UNSUCCESSFULL" });
  }
});

authRouter.get("/google", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: "http://localhost:3000/auth/google/callback",
    response_type: "code",
    scope: "profile email",
    access_type: "offline",
    prompt: "none",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  res.redirect(googleAuthUrl);
});

authRouter.get(
  "/google/callback",

  async (req, res) => {
    try {
      const code = req.query.code;

      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "http://localhost:3000/auth/google/callback",
      });

      const tokenResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        tokenParams.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const { access_token } = tokenResponse.data;

      const userInfo = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const user = userInfo.data;

      req.session.user = {
        googleID: user.id,
        name: user.name,
        email: user.email,
        ...user,
        provider: "google",
      };
      res.redirect("/profile");
    } catch (error) {
      console.error("OAuth Error:", error.response?.data || error);
      res.status(500).send("Authentication failed");
    }
  },
);

authRouter.get("/github", (req, res) => {
  const state = randomUUID();
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: "http://localhost:3000/auth/github/callback",
    scope: "user:email",
    state: state,
    response_type: "code",
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params}`;
  res.redirect(authUrl);
});
authRouter.get("/github/callback", async (req, res) => {
  try {
    const { state, code } = req.query;
    console.log(req.query);

    const authParams = new URLSearchParams({
      code: code,
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      redirect_uri: "http://localhost:3000/auth/github/callback",
    });

    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      authParams.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "my-node-oauth-app",
        },
      },
    );

    const { access_token } = response.data;

    const user = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    req.session.user = {
      ...user.data,
      provider: "Github",
    };

    res.redirect("/profile");
  } catch (error) {
    console.log(error);
  }
});
