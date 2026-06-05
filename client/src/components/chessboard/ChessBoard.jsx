import { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useSocket } from "../../hooks/useSocket.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import axios from "axios";
import { customPieces } from "./CustomPieces.jsx";
function PlayerBar({ player }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg border bg-surface-2 border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-xs">
          {player?.name?.[0] || "?"}
        </div>
        <span className="text-sm text-text-primary">
          {player?.name || "Waiting..."}
        </span>
      </div>
      <div className="text-xs text-text-secondary">05:00</div>
    </div>
  );
}
function ChessBoard() {
  const { user } = useAuth();
  const { serverMessage, emitEvent } = useSocket();

  const [gameState, setGameState] = useState({
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    gameID: null,
    moves: [],
    blackPlayer: { id: null, name: null },
    whitePlayer: { id: null, name: null },
    message: null,
  });

  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});
  const [gameType, setGameType] = useState("CLASSICAL");

  const types = ["BULLET", "BLITZ", "RAPID", "CLASSICAL"];

  useEffect(() => {
    const fetchActiveGame = async () => {
      const res = await axios.get("/api/game/active", {
        withCredentials: true,
      });

      if (!res.data.success) return;

      emitEvent("message", {
        type: "join_room",
        payload: { gameID: res.data.gameID },
      });
    };

    fetchActiveGame();
  }, []);

  useEffect(() => {
    setGameState((prev) => ({ ...prev, ...serverMessage.payload }));
  }, [serverMessage]);

  useEffect(() => {
    if (gameState.fen) {
      chessGame.load(gameState.fen);
    }
  }, [gameState.fen]);

  // handle piece drop
  function onPieceDrop({ sourceSquare, targetSquare }) {
    // type narrow targetSquare potentially being null (e.g. if dropped off board)

    if (!targetSquare) {
      return false;
    }

    // try to make the move according to chess.js logic
    try {
      emitEvent("message", {
        type: "move",
        payload: {
          gameID: gameState.gameID,
          move: { from: sourceSquare, to: targetSquare },
        },
      });
      // return true as the move was successful
      return true;
    } catch {
      // return false as the move was not successful
      return false;
    }
  }

  // allow white to only drag white pieces
  function canDragPieceWhite({ piece }) {
    return piece.pieceType[0] === "w";
  }

  // allow black to only drag black pieces
  function canDragPieceBlack({ piece }) {
    return piece.pieceType[0] === "b";
  }

  function getMoveOptions(square) {
    // get the moves for the square
    const moves = chessGame.moves({
      square,
      verbose: true,
    });

    // if no moves, clear the option squares
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    // create a new object to store the option squares
    const newSquares = {};

    // loop through the moves and set the option squares
    for (const move of moves) {
      newSquares[move.to] = {
        background:
          chessGame.get(move.to) &&
          chessGame.get(move.to)?.color !== chessGame.get(square)?.color
            ? "radial-gradient(circle, rgba(219, 9, 9, 0.49) 85%, transparent 85%)" // larger circle for capturing
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",

        // smaller circle for moving
        borderRadius: "50%",
      };
    }

    // set the square clicked to move from to yellow
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };
    // set the option squares
    setOptionSquares(newSquares);

    // return true to indicate that there are move options
    return true;
  }

  function onSquareClick({ square, piece }) {
    // piece clicked to move

    if (!moveFrom && piece) {
      // get the move options for the square
      const hasMoveOptions = getMoveOptions(square);
      // if move options, set the moveFrom to the square
      if (hasMoveOptions) {
        setMoveFrom(square);
      }
      // return early
      return;
    }

    // square clicked to move to, check if valid move
    const moves = chessGame.moves({
      square: moveFrom,
      verbose: true,
    });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);
    // not a valid move
    if (!foundMove) {
      // check if clicked on new piece
      const hasMoveOptions = getMoveOptions(square);
      // if new piece, setMoveFrom, otherwise clear moveFrom
      setMoveFrom(hasMoveOptions ? square : "");
      // return early
      return;
    }
    // is normal move
    try {
      emitEvent("message", {
        type: "move",
        payload: {
          gameID: gameState.gameID,
          move: { from: moveFrom, to: square },
        },
      });
    } catch {
      // if invalid, setMoveFrom and getMoveOptions
      const hasMoveOptions = getMoveOptions(square);
      // if new piece, setMoveFrom, otherwise clear moveFrom
      if (hasMoveOptions) {
        setMoveFrom(square);
      }
      // return early
      return;
    }
    // clear moveFrom and optionSquares
    setMoveFrom("");
    setOptionSquares({});
  }

  const whiteBoardOptions = {
    canDragPieceWhite: canDragPieceWhite,
    position: gameState.fen,
    onPieceDrop,
    onSquareClick,
    boardOrientation: "white",
    squareStyles: optionSquares,
    id: "multiplayer-white",
    pieces: customPieces,
  };

  const blackBoardOptions = {
    canDragPieceBlack: canDragPieceBlack,
    position: gameState.fen,
    onPieceDrop,
    onSquareClick,
    boardOrientation: "black",
    squareStyles: optionSquares,
    id: "multiplayer-black",
    pieces: customPieces,
  };

  const isPlayerWhite = gameState.whitePlayer?.id === user?.userId;

  return (
    <div className="h-screen overflow-hidden bg-bg text-text-primary flex items-center justify-center px-4">
      <div className="w-full max-w-7xl h-full grid grid-cols-[260px_1fr_260px] gap-4 py-4">
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Play Chess</h2>
              <p className="text-xs text-text-secondary">Select time control</p>
            </div>

            {!gameState.gameID ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => setGameType(type)}
                      className={`py-3 text-xs rounded-lg border transition-all ${
                        gameType === type
                          ? "bg-surface border-border shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                          : "bg-bg hover:bg-surface"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    emitEvent("message", {
                      type: "init_bot_game",
                      payload: { gameType },
                    })
                  }
                  className="w-full py-3 text-xs bg-surface border border-border rounded-lg hover:bg-surface-hover transition-all active:scale-95"
                >
                  Start Game
                </button>
              </>
            ) : (
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Game</span>
                  <span>{gameState.gameID}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-secondary">Status</span>
                  <span>
                    {gameState.blackPlayer?.id ? "Playing" : "Waiting"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {gameState.gameID && (
            <button
              onClick={() =>
                emitEvent("message", {
                  type: "exit_game",
                  payload: { gameID: gameState.gameID },
                })
              }
              className="mt-4 py-2 text-xs border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/10 transition"
            >
              Resign / Exit
            </button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="text-xs text-text-secondary">
            {gameState.blackPlayer?.id
              ? "Match in progress"
              : "Waiting for opponent..."}
          </div>

          <div className="w-full max-w-xl flex flex-col gap-3">
            <PlayerBar player={gameState.blackPlayer} />

            <div className="relative">
              <div className="absolute inset-0 bg-white/5 blur-2xl opacity-20 rounded-2xl" />

              <div className="relative bg-surface border border-border rounded-2xl p-4">
                {gameState.gameID ? (
                  gameState.blackPlayer?.id ? (
                    <Chessboard
                      width={520}
                      {...(isPlayerWhite
                        ? whiteBoardOptions
                        : blackBoardOptions)}
                    />
                  ) : (
                    <div className="h-130 flex items-center justify-center text-sm text-text-secondary">
                      Waiting for opponent...
                    </div>
                  )
                ) : (
                  <div className="h-130 flex flex-col items-center justify-center text-text-secondary gap-2">
                    <div className="text-lg">♟️</div>
                    <p className="text-sm">Create a game to begin</p>
                  </div>
                )}
              </div>
            </div>

            <PlayerBar player={gameState.whitePlayer} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col">
          <h2 className="text-xs text-text-secondary mb-2">Moves</h2>

          <div className="grid grid-cols-2 gap-x-4 text-xs">
            {gameState.moves.slice(0, 40).map((move, i) => (
              <div key={i} className="text-text-primary">
                {i + 1}. {move.from}-{move.to}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChessBoard;
