import ChessBoard from "../components/chessboard/ChessBoard.jsx";
import Chess from "../components/Chess.jsx";
import Monitor from "../components/Monitor.jsx";

const Game = () => {
  const [gameType, setGameType] = useState("CLASSICAL");

  const types = ["BULLET", "BLITZ", "RAPID", "CLASSICAL"];
  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="flex bg-surface-2 p-1 rounded-xl border border-border">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setGameType(type)}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                gameType === type
                  ? "bg-text-primary text-bg"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            emitEvent("message", {
              type: "init_game",
              payload: { gameType },
            });
          }}
          className="px-6 py-2.5 rounded-lg bg-text-primary text-bg font-medium hover:opacity-90 active:scale-[0.98] transition"
        >
          New Game ({gameType})
        </button>
      </div>
      <ChessBoard></ChessBoard>
      <Monitor />
      {/* <Chess /> */}
    </>
  );
};

export default Game;
