import { socketManager } from "./socketManager.js";
import { Chess } from "chess.js";
import { randomUUID } from "crypto";
import pool from "./database.js";

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
  async updateSecondPlayer(P2UserID) {
    this.P2UserID = P2UserID;

    const userIds = [this.P1UserID, this.P2UserID].filter(Boolean);

    const { rows: users } = await pool.query(
      `SELECT * FROM "user" WHERE id = ANY($1)`,
      [userIds],
    );

    try {
      await this.createGameInDb();
    } catch (e) {
      console.error(e);
      return;
    }

    const WhitePlayer = users.find((user) => user.id === this.P1UserID);
    const BlackPlayer = users.find((user) => user.id === this.P2UserID);

    socketManager.broadcast(this.gameID, {
      type: "init_game",
      payload: {
        gameID: this.gameID,
        whitePlayer: { name: WhitePlayer?.name, id: this.P1UserID },
        blackPlayer: { name: BlackPlayer?.name, id: this.P2UserID },
        fen: this.board.fen(),
        moves: [],
      },
    });
  }

  async createGameInDb() {
    this.startTime = new Date(Date.now());
    this.lastMoveTime = this.startTime;

    const { rows } = await pool.query(
      `
    INSERT INTO "game" (
      id,
      "timeControl",
      status,
      "startAt",
      "currentFen",
      "whitePlayerId",
      "blackPlayerId"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
    `,
      [
        this.gameId,
        "CLASSICAL",
        "IN_PROGRESS",
        this.startTime,
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        this.P1UserID,
        this.P2UserID ?? null,
      ],
    );

    const game = rows[0];
    this.gameId = game.id;
  }

  async addMoveToDb(move, moveTimestamp) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
      INSERT INTO "move" (
        "gameId",
        "moveNumber",
        "from",
        "to",
        "before",
        "after",
        "createdAt",
        "timeTaken",
        "san"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `,
        [
          this.gameId,
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
      UPDATE "game"
      SET "currentFen" = $1
      WHERE id = $2;
      `,
        [move.after, this.gameId],
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
      return;
    }

    if (this.board.turn() === "b" && user.userId !== this.P2UserID) {
      return;
    }

    if (this.result) {
      console.error(
        `User ${user.userId} is making a move post game completion`,
      );
      return;
    }

    const moveTimestamp = new Date();

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
      }
    } catch (e) {
      console.error("Error while making move");
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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `
      INSERT INTO "move" (
        "gameId",
        "moveNumber",
        "from",
        "to",
        "before",
        "after",
        "createdAt",
        "timeTaken",
        "san"
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);
      `,
        [
          this.gameId,
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
      UPDATE "game"
      SET "currentFen" = $1
      WHERE id = $2;
      `,
        [move.after, this.gameId],
      );

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    this.resetAbandonTimer();
    this.resetMoveTimer();

    this.lastMoveTime = moveTimestamp;

    socketManager.broadcast(
      this.gameId,
      JSON.stringify({
        type: "move",
        payload: {
          move,
          P1TimeConsumed: this.P1TimeConsumed,
          P2TimeConsumed: this.P2TimeConsumed,
        },
      }),
    );

    if (this.board.isGameOver()) {
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
    this.timer = setTimeout(() => {
      this.endGame(
        "ABANDONED",
        this.board.turn() === "b" ? "WHITE_WINS" : "BLACK_WINS",
      );
    }, 60 * 1000);
  }

  async resetMoveTimer() {
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
    }
    const turn = this.board.turn();
    const timeLeft =
      GAME_TIME_MS - (turn === "w" ? this.P1TimeConsumed : this.P2TimeConsumed);

    this.moveTimer = setTimeout(() => {
      this.endGame("TIME_UP", turn === "b" ? "WHITE_WINS" : "BLACK_WINS");
    }, timeLeft);
  }

  async exitGame(user) {
    this.endGame(
      "PLAYER_EXIT",
      user.userId === this.P2UserID ? "WHITE_WINS" : "BLACK_WINS",
    );
  }

  async endGame(status, result) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // update game
      const { rows: gameRows } = await client.query(
        `
      UPDATE "game"
      SET status = $1, result = $2
      WHERE id = $3
      RETURNING *;
      `,
        [status, result, this.gameId],
      );

      const game = gameRows[0];

      // get moves ordered
      const { rows: moves } = await client.query(
        `
      SELECT *
      FROM "move"
      WHERE "gameId" = $1
      ORDER BY "moveNumber" ASC;
      `,
        [this.gameId],
      );

      // get players
      const { rows: whitePlayerRows } = await client.query(
        `SELECT id, name FROM "user" WHERE id = $1;`,
        [game.whitePlayerId],
      );

      const { rows: blackPlayerRows } = await client.query(
        `SELECT id, name FROM "user" WHERE id = $1;`,
        [game.blackPlayerId],
      );

      await client.query("COMMIT");

      const whitePlayer = whitePlayerRows[0];
      const blackPlayer = blackPlayerRows[0];

      socketManager.broadcast(
        this.gameId,
        JSON.stringify({
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
        }),
      );
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
