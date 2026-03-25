import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { GameManager } from "./gameManager.js";
import { socketManager } from "./socketManager.js";
import pool from "./database.js";

import "dotenv/config";

const PORT = 3001;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

socketManager.setIO(io);
const gameManager = new GameManager();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized: No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded is ", decoded);

    if (!pool) {
      return next(new Error("Database configuration error"));
    }

    const { rows } = await pool.query(
      `SELECT id, name, email FROM "User" WHERE id = $1`,
      [decoded.userId],
    );
    const user = rows[0];

    if (!user) {
      return next(new Error("Not Found"));
    }

    if (!user.name) {
      socket.user = {
        userId: decoded.userId,
        name: user.email.slice(0, 6),
      };
      return next();
    }

    socket.user = {
      userId: decoded.userId,
      name: user.name,
    };
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  console.log("Socket user ID - ", socket.user.userId);
  console.log("Socket user Name - ", socket.user.name);

  const user = {
    socket,
    userId: socket.user.userId,
  };

  gameManager.addUser(user);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    gameManager.removeUser(user);
  });
});

httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
