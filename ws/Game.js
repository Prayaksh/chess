import { socketManager } from "./socketManager.js";
import { Chess } from "chess.js";
import { randomUUID } from "crypto";
const GAME_TIME_MS = 10 * 60 * 1000;
export function isPromoting(chess, from, to) {
  if (!from) {
    return false;
  }
  const piece = chess.get(from);
  if (piece?.type !== "p") {
    return false;
  }
  if (piece.color !== chess.turn()) {
    return false;
  }
  if (!["1", "8"].some((it) => to.endsWith(it))) {
    return false;
  }

  return chess
    .moves({ square: from, verbose: true })
    .map((it) => it.to)
    .includes(to);
}
export class Game {
  constructor(P1UserID, P2UserID, gameID = null, startTime = null) {
    this.P1UserID = P1UserID;
    this.P2UserID = P2UserID;
    this.board = new Chess();
    this.gameID = gameID || randomUUID();
    this.result = null;
    this.moveCount = 0;
    this.moveTimer = null;
    this.timer = null;
    this.P1TimeConsumed = 0;
    this.P2TimeConsumed = 0;
    this.startTime = startTime ? new Date(startTime) : new Date();
    this.lastMoveTime = this.startTime;
  }
  seedMoves(moves) {
    moves.forEach((move) => {
      if (isPromoting(this.board, move.from, move.to)) {
        this.board.move({ from: move.from, to: move.to, promotion: "q" });
      } else {
        this.board.move({ from: move.from, to: move.to });
      }
    });
    this.moveCount = moves.length;
    if (moves.length > 0 && moves[moves.length - 1].createdAt) {
      this.lastMoveTime = new Date(moves[moves.length - 1].createdAt);
    }

    moves.forEach((move, index) => {
      if (move.timeTaken) {
        if (index % 2 === 0) {
          this.P1TimeConsumed += move.timeTaken;
        } else {
          this.P2TimeConsumed += move.timeTaken;
        }
      }
    });
    this.resetAbandonTimer();
    this.resetMoveTimer();
  }
  updateSecondPlayer(P2UserID) {
    this.P2UserID = P2UserID;
    socketManager.broadcast(this.gameID, {
      type: "init_game",
      payload: {
        gameID: this.gameID,
        whitePlayer: { id: this.P1UserID },
        blackPlayer: { id: this.P2UserID },
        fen: this.board.fen(),
        moves: [],
      },
    });
  }

  makeMove(user, move) {
    if (this.board.turn() === "w" && user.id !== this.P1UserID) {
      console.log("Not ur turn to move");
      return;
    }
    if (this.board.turn() === "b" && user.id !== this.P2UserID) {
      console.log("Not ur turn to move");
      return;
    }

    if (this.result) {
      console.warn("Move after game over by", user.id);
      return;
    }

    if (!move?.from || !move?.to) {
      console.error("Garbage move ");
      return;
    }
    const moveTimeStamp = new Date();
    try {
      if (isPromoting(this.board, move.from, move.to)) {
        this.board.move({ from: move.from, to: move.to, promotion: "q" });
      } else {
        this.board.move({ from: move.from, to: move.to });
      }
    } catch (e) {
      socketManager.broadcast(this.gameID, {
        type: "game_alert",
        payload: { message: "Invalid Move" },
      });
      console.error("Invalid move", move, e);
      return;
    }

    const elapsed = moveTimeStamp.getTime() - this.lastMoveTime.getTime();
    if (this.board.turn() === "b") {
      this.P1TimeConsumed += elapsed;
    } else {
      this.P2TimeConsumed += elapsed;
    }
    this.lastMoveTime = moveTimeStamp;

    socketManager.broadcast(this.gameID, {
      type: "move",
      payload: {
        move,
        fen: this.board.fen(),
        P1TimeConsumed: this.P1TimeConsumed,
        P2TimeConsumed: this.P2TimeConsumed,
      },
    });
    if (this.board.isGameOver()) {
      const result = this.board.isDraw()
        ? "DRAW"
        : this.board.turn() === "b"
        ? "BLACK_WINS"
        : "WHITE_WINS";

      this.endGame("COMPLETED", result);
      return;
    }
    this.moveCount++;
    this.resetAbandonTimer();
    this.resetMoveTimer();
  }

  getP1TimeConsumed() {
    if (this.board.turn() === "w") {
      return this.P1TimeConsumed + (Date.now() - this.lastMoveTime.getTime());
    }
    return this.P1TimeConsumed;
  }
  getP2TimeConsumed() {
    if (this.board.turn() === "b") {
      return this.P2TimeConsumed + (Date.now() - this.lastMoveTime.getTime());
    }
    return this.P2TimeConsumed;
  }
  resetAbandonTimer() {
    console.log("resetAbandonTimer initialized");
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const winner = this.board.turn() === "b" ? "WHITE_WINS" : "BLACK_WINS";
      console.log("ending game with status ABANDONED");
      this.endGame("ABANDONED", winner);
    }, 60 * 1000); //make it 1 min after debugging
  }

  resetMoveTimer() {
    console.log("resetMoveTimer initialized");
    if (this.moveTimer) clearTimeout(this.moveTimer);
    const turn = this.board.turn();
    const timeUsed = turn === "w" ? this.P1TimeConsumed : this.P2TimeConsumed;
    const timeLeft = GAME_TIME_MS - timeUsed;

    if (timeLeft <= 0) {
      const winner = turn === "b" ? "WHITE_WINS" : "BLACK_WINS";
      console.log("ending game with status TIME_UP");
      this.endGame("TIME_UP", winner);
      return;
    }
  }

  exitGame(user) {
    console.log("exitGame initialized");
    console.log("P1 userID - ", this.P1UserID, "P2 userID -", this.P2UserID);
    console.log("User.id ", user.id);
    if (![this.P1UserID, this.P2UserID].includes(user.id)) return;
    const winner = user.id === this.P2UserID ? "WHITE_WINS" : "BLACK_WINS";
    console.log("ending game with status PLAYER_EXIT");

    this.endGame("PLAYER_EXIT", winner);
  }

  endGame(status, result) {
    console.log("endGame initialized");
    if (this.result) return;
    this.result = result;
    socketManager.broadcast(this.gameID, {
      type: "game_ended",
      payload: {
        result,
        status,
        fen: this.board.fen(),
        P1TimeConsumed: this.P1TimeConsumed,
        P2TimeConsumed: this.P2TimeConsumed,
      },
    });
    this.clearTimer();
    this.clearMoveTimer();
  }

  clearMoveTimer() {
    if (this.moveTimer) clearTimeout(this.moveTimer);
  }

  clearTimer() {
    if (this.timer) clearTimeout(this.timer);
  }
}
