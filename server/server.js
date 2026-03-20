import express from "express";
import { authRouter } from "./authRouter.js";
import session from "express-session";
import path from "path";
import { gameRouter } from "./gameRouter.js";
import pool from "./database.js";
const app = express();
const PORT = 3000;

app.use(
  session({
    secret: "keyboard cat",
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

app.get("/database", async (req, res) => {
  try {
    const users = await pool.query("SELECT * FROM User");
    res.send(users);
  } catch (e) {
    res.json({
      message: "An error occurred while fetching user data",
      error: e,
    });
  }
});
app.use("/api/game", isAuthenticated, gameRouter);

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
