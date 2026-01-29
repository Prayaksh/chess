import { io } from "socket.io-client";
const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("socket connected", socket.id);
});

socket.on("disconnect", () => {
  console.log("socket disconnected");
});

export { socket };
