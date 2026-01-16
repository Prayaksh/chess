import "./App.css";
import { socket } from "./socket.js";
import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState({});
  useEffect(() => {
    socket.connect();
    console.log("connected to the server");

    socket.on("message", (message) => {
      setMessage(message);
    });
  }, []);

  return (
    <div>
      <button
        className="h-100 w-300 p-20 bg-red-900"
        onClick={() => {
          socket.emit("message", {
            type: "init_game",
            payload: { message: "Game initialized " },
          });
        }}
      >
        send json message
      </button>
      <div>{JSON.stringify(message, 2, null)}</div>
    </div>
  );
}

export default App;
