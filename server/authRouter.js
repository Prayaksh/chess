import { Router } from "express";
export const authRouter = Router();
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import pool from "./database.js";

authRouter.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email or Password not provided" });
    }

    const hashedPassword = await bcrypt(password, 10);

    const query = `INSERT INTO "User" (email, password, provider) VALUES ($1, $2, $3) RETURNING id;`;
    const values = [email, hashedPassword, "CREDENTIALS"];
    const { rows } = await pool.query(query, values); //what if value does not exists?
    const user = rows[0];

    req.session.user = {
      userId: user.id,
    };

    //set this is database and authorize the user
    //what a fuckass idiot to not provide the user ID here xD
  } catch (error) {
    console.error(error);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email or Password not provided" });
    }

    const query = `SELECT id, username, email, password, provider FROM "User" WHERE email = $1 OR username = $1 LIMIT 1; `;
    const values = [identifier];

    const { rows } = await pool.query(query, values);
    const user = rows[0];

    //user not found
    if (!user) {
      //conscious decision to not directly redirect to the /signup route cause that would cause issues if user by mistake wrote some wrong user id
      return res.json({ success: false, message: "Invalid Credentials" }); //capital c for identifier small for password hehe
    }

    if (user.provider === "CREDENTIALS") {
      return res.json({
        success: false,
        message: "Provider changed, try logging from the authorized provider",
      });
    }

    const status = await bcrypt.compare(password, user.password);

    if (!status) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    //check in database and log user in if correct
    //no doubt
    req.session.user = {
      userId: user.id, //hehe
    };

    req.session.save((error) => {
      if (error) {
        console.error("An error occurred", error);
        return res.json({
          success: false,
          message: "Error occurred while saving session",
        });
      }
      res
        .status(200)
        .json({ success: true, message: "Successfully logged user in" });
    });
  } catch (error) {
    console.error("An error occurred", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

authRouter.get("/google", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: "http://localhost:3000/auth/google/callback",
    response_type: "code",
    scope: "profile email",
    access_type: "offline",
    prompt: "none", //"consent" once done with development
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  res.redirect(googleAuthUrl);
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Error occurred while logging out", error);
      return res
        .status(500)
        .json({ success: false, message: "Cannot log out" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Successfully logged user out" });
  });
});

authRouter.get(
  "/google/callback",

  async (req, res) => {
    try {
      const code = req.query.code;
      if (!code) {
        return res
          .status(400)
          .send("Authorization code missing from Google redirect.");
      }

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
      if (!access_token) {
        return res.status(400).send("Missing Access Token");
      }

      const userInfo = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const profile = userInfo.data;

      //=====database error=========
      //column "provider" of relation "User" does not exist

      const query = `
      INSERT INTO "User" (email, name, provider)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name
      RETURNING *;
      `;

      const values = [profile.email, profile.name, "GOOGLE"];

      const { rows } = await pool.query(query, values); //what if value does not exists?
      const user = rows[0];

      req.session.user = {
        userId: user.id,
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

    if (!access_token) {
      return res.status(400).send("Missing Access Token");
    }

    let profile = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const fetchEmail = await axios.get("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    profile.data.email = fetchEmail.data[0].email;

    if (!profile.data.email) {
      return res
        .status(400)
        .json({ success: false, message: "Error while fetching email" });
    }

    try {
      const query = `
      INSERT INTO "User" (email, name, provider)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name
      RETURNING *;
      `;

      const values = [profile.data.email, profile.data.name, "GITHUB"];

      const { rows } = await pool.query(query, values);
      const user = rows[0];

      req.session.user = {
        userId: user.id,
      };

      res.redirect("/profile");
    } catch (error) {
      return res
        .status(400)
        .json({ success: false, message: "Error while accessing database" });
    }
  } catch (error) {
    console.log(error);
  }
});
