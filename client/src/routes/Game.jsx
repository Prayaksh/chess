import { useEffect, useState } from "react";
import { socket } from "../socket.js";

const Game = () => {
  const [message, setMessage] = useState({});
  const [userSocket, setUserSocket] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("socket connected to server with id -", socket.id);
      setUserSocket(socket);
    });

    socket.on("message", (data) => {
      setMessage(data);
    });

    return () => {
      socket.off("connect");
      socket.off("message");
    };
  }, []);

  return (
    <div>
      Game Page <h1>Socket initiated with id - {userSocket?.id}</h1>
      <button
        onClick={() =>
          socket.emit("message", {
            type: "init_game",
            payload: { message: "Game initialized" },
          })
        }
      >
        INIT GAME
      </button>
      {message.type === "game_added" ? (
        <p>GAME ADDED WITH GAME ID - {message.gameID}</p>
      ) : (
        <p>{JSON.stringify(message)}</p>
      )}
    </div>
  );
};

export default Game;
