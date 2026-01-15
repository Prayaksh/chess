import { Server } from "socket.io";
import { GameManager } from "./gameManager.js";
import { socketManager, User } from "./socketManager.js";

const PORT = 3001;

const io = new Server({
  cors: {
    origin: "*",
  },
});

const gameManager = new GameManager();
io.on("connection", (socket) => {
  console.log("new socket connected - ", socket.id);
  socketManager.setIO(io);
  const user = new User(socket);
  gameManager.addUser(user);

  socket.on("disconnect", () => gameManager.removeUser(socket));
});

io.listen(PORT, console.log(`WSS started at http://Localhost:${PORT}`));
