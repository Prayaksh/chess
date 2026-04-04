import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { GameManager } from "./gameManager.js";
import { socketManager } from "./socketManager.js";
import pool from "./database.js";

import "dotenv/config";
export function socketInitializer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
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

      const { rows } = await pool.query(
        `SELECT id, name, email FROM "User" WHERE id = $1`,
        [decoded.userId],
      );

      const user = rows[0];

      if (!user) {
        return next(new Error("Not Found"));
      }

      socket.user = {
        userId: decoded.userId,
        name: user.name || user.email.slice(0, 6),
      };

      next();
    } catch (err) {
      console.error("Auth error:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    const user = {
      socket,
      userId: socket.user.userId,
      name: socket.user.name,
    };

    gameManager.addUser(user);

    socket.on("disconnect", () => {
      gameManager.removeUser(user);
    });
  });

  return io;
}
