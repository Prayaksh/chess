import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { GameManager } from "./gameManager.js";
import { socketManager } from "./socketManager.js";

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

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized: No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded is ", decoded)

    socket.user = {
      userId: decoded.userId,
      name: decoded.name,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  console.log("Socket user ID - ", socket.user.userID);

  const user = {
    socket,
    userId: socket.user.userId,
    name: socket.user.name,
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
