import { socketManager } from "./socketManager.js";
import { Chess } from "chess.js";
import { randomUUID } from "crypto";
import pool from "./database.js";

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
    this.P1Username = "Guest";
    this.P2UserID = P2UserID;
    this.P2Username = "Guest";
    this.board = new Chess();
    this.gameID = gameID ?? randomUUID();
    this.result = null;
    this.moveCount = 0; //for enpasant
    this.moveTimer = null; //each move timer
    this.timer = null; //overall game timer
    this.P1TimeConsumed = 0; //total time consumed by P1
    this.P2TimeConsumed = 0; //total time consumed by P2
    this.startTime = startTime ? new Date(startTime) : new Date();
    this.lastMoveTime = this.startTime;
    this.gameType = "CLASSICAL"; //todo make this for all 4 types

    console.log("Game created successfully with gameID :", this.gameID);
  }

  //moving the board once rejoined logic
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
  async updateSecondPlayer(P2UserID) {
    this.P2UserID = P2UserID;

    const userIds = [this.P1UserID, this.P2UserID].filter(Boolean);

    const { rows: users } = await pool.query(
      `SELECT * FROM "User" WHERE id = ANY($1)`,
      [userIds],
    );

    try {
      await this.createGameInDb();
    } catch (e) {
      console.error("An error occurred while creating game in database -", e);
      return;
    }

    const WhitePlayer = users.find((user) => user.id === this.P1UserID);
    this.P1Username = WhitePlayer?.name;
    const BlackPlayer = users.find((user) => user.id === this.P2UserID);
    this.P2Username = BlackPlayer?.name;

    socketManager.broadcast(this.gameID, {
      type: "init_game",
      payload: {
        gameID: this.gameID,
        whitePlayer: { name: this.P1Username, id: this.P1UserID },
        blackPlayer: { name: this.P2Username, id: this.P2UserID },
        fen: this.board.fen(),
        moves: [],
      },
    });
  }

  //onetime creation
  async createGameInDb() {
    this.startTime = new Date(Date.now());

    let gameTime;

    switch (this.gameType) {
      case "BULLET":
        gameTime = 3 * 60 * 1000;
        break;

      case "BLITZ":
        gameTime = 10 * 60 * 1000;
        break;

      case "RAPID":
        gameTime = 60 * 60 * 1000;
        break;

      case "CLASSICAL":
        gameTime = 120 * 60 * 1000;
        break;

      default:
        gameTime = 120 * 60 * 1000;
    }
    this.endTime = new Date(this.startTime.getTime() + gameTime);

    if (!this.gameID) {
      console.log("gameID null");
      return;
    }

    await pool.query(
      `
    INSERT INTO "Game" (
    id,
    status,
    timecontrol,
    startat,
    endat,
    currentfen,
    whiteplayerid,
    blackplayerid
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;
    `,
      [
        this.gameID,
        "ONGOING",
        this.gameType,
        this.startTime,
        this.endTime,
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        this.P1UserID,
        this.P2UserID ?? null,
      ],
    );
  }

  async addMoveToDb(move, moveTimestamp) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
      INSERT INTO "Move" (
        gameid,
        movenumber,
        "from",
        "to",
        before,
        after,
        createdat,
        timetaken,
        san
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `,
        [
          this.gameID,
          this.moveCount + 1,
          move.from,
          move.to,
          move.before,
          move.after,
          moveTimestamp,
          moveTimestamp.getTime() - this.lastMoveTime.getTime(),
          move.san,
        ],
      );

      await client.query(
        `
      UPDATE "Game"
      SET currentfen = $1
      WHERE id = $2;
      `,
        [move.after, this.gameID],
      );

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async makeMove(user, move) {
    if (this.board.turn() === "w" && user.userId !== this.P1UserID) {
      console.log("White's turn");
      return;
    }

    if (this.board.turn() === "b" && user.userId !== this.P2UserID) {
      console.log("Black's turn");
      return;
    }

    if (this.result) {
      console.error(
        `User ${user.userId} is making a move post game completion`,
      );
      return;
    }

    const moveTimestamp = new Date(Date.now());

    try {
      if (isPromoting(this.board, move.from, move.to)) {
        this.board.move({
          from: move.from,
          to: move.to,
          promotion: "q",
        });
      } else {
        this.board.move({
          from: move.from,
          to: move.to,
        });
        console.log("successfull move");
      }
    } catch (e) {
      console.error("Wrong move");
      return;
    }

    if (this.board.turn() === "b") {
      this.P1TimeConsumed +=
        moveTimestamp.getTime() - this.lastMoveTime.getTime();
    }

    if (this.board.turn() === "w") {
      this.P2TimeConsumed +=
        moveTimestamp.getTime() - this.lastMoveTime.getTime();
    }

    const history = this.board.history({ verbose: true });
    const boardHistory = history[history.length - 1];
    const verboseMove = {
      ...move,
      before: boardHistory.before,
      after: boardHistory.after,
      san: boardHistory.san,
    };
    try {
      await this.addMoveToDb(verboseMove, moveTimestamp);
    } catch (error) {
      console.error(
        "An error occurred while saving moves in database -",
        error,
      );
      return;
    }

    this.resetAbandonTimer();
    this.resetMoveTimer();

    this.lastMoveTime = moveTimestamp;

    socketManager.broadcast(this.gameID, {
      type: "move",
      payload: {
        fen: this.board.fen(),
        move,
        P1TimeConsumed: this.P1TimeConsumed,
        P2TimeConsumed: this.P2TimeConsumed,
      },
    });

    if (this.board.isGameOver()) {
      console.log("Game over flag turned true");
      const result = this.board.isDraw()
        ? "DRAW"
        : this.board.turn() === "b"
          ? "WHITE_WINS"
          : "BLACK_WINS";

      this.endGame("COMPLETED", result);
    }

    this.moveCount++;
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
  async resetAbandonTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(
      () => {
        this.endGame(
          "ABANDONED",
          this.board.turn() === "b" ? "WHITE_WINS" : "BLACK_WINS",
        );
      },
      5 * 60 * 1000,
    );
  }

  async resetMoveTimer() {
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
    }

    let gameTime;

    switch (this.gameType) {
      case "BULLET":
        gameTime = 3 * 60 * 1000;
        break;
      case "BLITZ":
        gameTime = 10 * 60 * 1000;
        break;
      case "RAPID":
        gameTime = 60 * 60 * 1000;
        break;
      case "CLASSICAL":
        gameTime = 120 * 60 * 1000;
        break;
      default:
        gameTime = 120 * 60 * 1000;
    }

    const turn = this.board.turn();
    const consumed = turn === "w" ? this.P1TimeConsumed : this.P2TimeConsumed;

    const timeLeft = Math.max(0, gameTime - consumed);

    this.moveTimer = setTimeout(() => {
      this.endGame("TIME_UP", turn === "b" ? "WHITE_WINS" : "BLACK_WINS");
    }, timeLeft);
  }
  async rejoinGame(user) {
    if (user.userId !== this.P1UserID && user.userId !== this.P2UserID) {
      console.log("cannot join");
      return;
    }

    const { rows: users } = await pool.query(
      `SELECT id, name FROM "User" WHERE id = ANY($1)`,
      [[this.P1UserID, this.P2UserID]],
    );

    const { rows: moves } = await pool.query(
      `
      SELECT "to","from"
      FROM "Move"
      WHERE gameid = $1
      ORDER BY movenumber ASC;
      `,
      [this.gameID],
    );

    this.P1Username = users.find((u) => u.id === this.P1UserID)?.name;
    this.P2Username = users.find((u) => u.id === this.P2UserID)?.name;

    user.socket.emit("message", {
      type: "joined_room",
      payload: {
        gameID: this.gameID,
        whitePlayer: { name: this.P1Username, id: this.P1UserID },
        blackPlayer: { name: this.P2Username, id: this.P2UserID },
        fen: this.board.fen(),
        moves: moves,
      },
    });
  }

  async exitGame(user) {
    this.endGame(
      "ABANDONED",
      user.userId === this.P2UserID ? "WHITE_WINS" : "BLACK_WINS",
    );
  }

  async endGame(status, result) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // update game
      await client.query(
        `
      UPDATE "Game"
      SET status = $1, result = $2
      WHERE id = $3;
      `,
        [status, result, this.gameID],
      );

      // get moves ordered
      const { rows: moves } = await client.query(
        `
      SELECT "to","from"
      FROM "Move"
      WHERE gameid = $1
      ORDER BY movenumber ASC;
      `,
        [this.gameID],
      );

      const { rows: whitePlayerRows } = await pool.query(
        `SELECT * FROM "User" WHERE id = $1`,
        [this.P1UserID],
      );
      const { rows: blackPlayerRows } = await pool.query(
        `SELECT * FROM "User" WHERE id = $1`,
        [this.P2UserID],
      );

      await client.query("COMMIT");

      const whitePlayer = whitePlayerRows[0];
      const blackPlayer = blackPlayerRows[0];

      socketManager.broadcast(this.gameID, {
        type: "game_ended",
        payload: {
          result,
          status,
          moves,
          blackPlayer: {
            id: blackPlayer?.id,
            name: blackPlayer?.name,
          },
          whitePlayer: {
            id: whitePlayer?.id,
            name: whitePlayer?.name,
          },
        },
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    this.clearTimer();
    this.clearMoveTimer();
  }

  clearMoveTimer() {
    if (this.moveTimer) clearTimeout(this.moveTimer);
  }

  setTimer(timer) {
    this.timer = timer;
  }

  clearTimer() {
    if (this.timer) clearTimeout(this.timer);
  }
}
