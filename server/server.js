import express from "express";
import { authRouter } from "./authRouter.js";
import session from "express-session";
import path from "path";
import jwt from "jsonwebtoken";
import pool from "./database.js";
import connectPgSimple from "connect-pg-simple";
const app = express();
const PORT = 3000;

const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24, sameSite: "lax", secure: false },
  }),
);
app.use(express.json());

app.use("/auth", authRouter);
app.get("/api", (req, res) => {
  res.json({ route: "/api" });
});

app.get("/api/ws-token", isAuthenticated, (req, res) => {
  console.log("req.session.userId - ", req.session.user.userId);
  const token = jwt.sign(
    {
      userId: req.session.user.userId,
      sessionId: req.session.id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  if (!token) {
    return res.status(400).json({ success: false, token: null });
  }

  res.status(200).json({ success: true, token: token });
});

app.get("/database", async (req, res) => {
  //to check the connection from the database
  try {
    const users = await pool.query(`SELECT * FROM "User"`);
    res.send(users);
  } catch (e) {
    res.json({
      message: "An error occurred while fetching user data",
      error: e,
    });
  }
});

app.get("/api/profile", isAuthenticated, (req, res) => {
  res.json({ user: req.session.user, autheticated: true });
});

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res
    .status(401)
    .json({ error: "UNAUTHORIZED", autheticated: false, user: null });
}

//serving the static resources (js and css)
app.use(express.static(path.join(process.cwd(), "../client/dist")));

//serving the html (all frontend routes goes here)
app.use(/.*/, (req, res) => {
  res.sendFile(path.join(process.cwd(), "../client/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Listening at http://Localhost:${PORT}`);
});
