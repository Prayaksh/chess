import { io } from "socket.io-client";

async function connectSocket() {
  try {
    const response = await fetch("http://localhost:3000/api/ws-token", {
      credentials: "include",
    });

    const data = await response.json();

    if (!data.success) {
      console.error("Error while fetching JWT Token");
      return;
    }

    const { token } = data;

    const socket = io("http://localhost:3001", {
      auth: { token },
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("socket connected", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected");
    });

    return socket;
  } catch (err) {
    console.error("Socket connection failed", err);
  }
}

const socket = await connectSocket();

export { socket };
