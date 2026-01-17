import express from "express";
import { authRouter } from "./authRouter.js";
import session from "express-session";
import { gameRouter } from "./gameRouter.js";
import path from "path";
import { __dirname } from "./gameRouter.js";
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

// app.use("/game", gameRouter);
// app.use("/game", express.static(path.join(process.cwd(), "../user/dist")));

app.get("/api", (req, res) => {
  res.send("home route");
});

app.get("/api/profile", isAuthenticated, (req, res) => {
  res.json(req.session.user);
});

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: "UNAUTHORIZED" });
}

app.use(express.static(path.join(process.cwd(), "../user/dist")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(process.cwd(), "../user/dist/index.html"));
});
app.listen(PORT, () => {
  console.log(`Listening at http://Localhost:${PORT}`);
});
