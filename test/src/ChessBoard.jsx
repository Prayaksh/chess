import { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useSocket } from "./SocketProvider.jsx";
import { socket } from "./main.js";

function ChessBoard() {
  const { serverMessage, emitEvent } = useSocket();
  const [val, setVal] = useState("");
  const [gameState, setGameState] = useState({
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    gameID: null,
    moves: [],
    blackPlayer: { id: null },
    whitePlayer: { id: null },
    message: null,
    //todo timeconsumed addition
  });

  // create a chess game using a ref to maintain the game state across renders
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  // track the current position of the chess game in state
  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});

  useEffect(() => {
    setGameState((prev) => ({ ...prev, ...serverMessage.payload }));
  }, [serverMessage]);

  useEffect(() => {
    if (gameState.fen) {
      chessGame.load(gameState.fen);
    }
  }, [gameState.fen]);

  //Server message processing goes here
  // switch (serverMessage.type) {
  //   case "init_game":
  //   case "game_alert":
  //   case "init_game":
  //   case "move":
  //   case "game_ended":
  //   default:
  // }

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

      // chessGame.move({
      //   from: sourceSquare,
      //   to: targetSquare,
      //   promotion: "q", // always promote to a queen for example simplicity
      // });

      // update the position state upon successful move to trigger a re-render of the chessboard

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
      // chessGame.move({
      //   from: moveFrom,
      //   to: square,
      //   promotion: "q",
      // });

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

  // set the chessboard options for white's perspective
  const whiteBoardOptions = {
    canDragPiece: canDragPieceWhite,
    position: gameState.fen,
    onPieceDrop,
    onSquareClick,
    boardOrientation: "white",
    squareStyles: optionSquares,
    id: "multiplayer-white",
  };

  // set the chessboard options for black's perspective
  const blackBoardOptions = {
    canDragPiece: canDragPieceBlack,
    position: gameState.fen,
    onPieceDrop,
    onSquareClick,
    boardOrientation: "black",
    squareStyles: optionSquares,
    id: "multiplayer-black",
  };
  // render both chessboards side by side with a gap
  return (
    <>
      {gameState.gameID ? (
        <div>Connected to the game</div>
      ) : (
        <button
          onClick={() => {
            emitEvent("message", { type: "init_game", payload: {} });
          }}
        >
          New Game
        </button>
      )}
      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          flexWrap: "wrap",
          padding: "10px",
        }}
      >
        <div>
          <p
            style={{
              textAlign: "center",
            }}
          >
            GameID - {gameState.gameID}
          </p>
          <div
            style={{
              maxWidth: "400px",
            }}
          >
            {gameState.gameID ? (
              gameState.blackPlayer.id ? (
                <Chessboard
                  options={
                    gameState.blackPlayer.id === socket.id
                      ? blackBoardOptions
                      : whiteBoardOptions
                  }
                />
              ) : (
                <div>Waiting for another player</div>
              )
            ) : (
              <div>Waiting to initialize the game</div>
            )}
          </div>
        </div>
        {/* <div>
        <p
          style={{
            textAlign: "center",
          }}
        >
          Black&apos;s perspective
        </p>
        <div
          style={{
            maxWidth: "400px",
          }}
        >
          <Chessboard options={blackBoardOptions} />
        </div>
      </div> */}
      </div>
    </>
  );
}
export default ChessBoard;
