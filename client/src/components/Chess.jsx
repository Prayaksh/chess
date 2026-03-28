import { useSocket } from "../hooks/useSocket.jsx";

const Chess = () => {
  const { serverMessage, emitEvent } = useSocket();

  return (
    <div>
      <p>{JSON.stringify(serverMessage, null, 2)}</p>
      <button
        onClick={() => {
          emitEvent("message", { type: "init_game", payload: {} });
        }}
      >
        Init Game
      </button>
    </div>
  );
};

export default Chess;
