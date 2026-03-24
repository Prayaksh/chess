import { Game } from "./Game.js";
import { socketManager } from "./socketManager.js";
import pool from "./database.js";

export class GameManager {
  constructor() {
    this.games = [];
    this.pendingGameID = null;
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
    this.addHandler(user);
  }

  removeUser(user) {
    this.users = this.users.filter((u) => u.userId !== user.userId);
    socketManager.removeUser(user);
  }

  removeGame(gameID) {
    this.games = this.games.filter((g) => g.gameID !== gameID);
  }

  addHandler(user) {
    user.socket.on("message", async (message) => {
      if (message.type === "init_game") {
        if (this.pendingGameID) {
          const game = this.games.find((g) => g.gameID === this.pendingGameID);

          socketManager.addUser(user, game.gameID);
          await game.updateSecondPlayer(user.userId);
          this.pendingGameID = null;
        } else {
          const game = new Game(user.userId, null);
          this.games.push(game);

          this.pendingGameID = game.gameID;
          socketManager.addUser(user, game.gameID);

          user.socket.emit("message", {
            type: "game_added",
            gameID: game.gameID,
          });
        }
      }

      if (message.type === "move") {
        const game = this.games.find(
          (g) => g.gameID === message.payload.gameID,
        );
        if (!game) return;

        await game.makeMove(user, message.payload.move);

        if (game.result) {
          this.removeGame(game.gameID);
        }
      }

      if (message.type === "join_room") {
        const gameID = message.payload.gameID;

        let game = this.games.find((g) => g.gameID === gameID);

        const { rows } = await pool.query(
          `SELECT * FROM "Game" WHERE id = $1`,
          [gameID],
        );

        if (!rows.length) {
          user.socket.emit("message", { type: "game_not_found" });
          return;
        }

        const gameFromDb = rows[0];

        if (!game) {
          game = new Game(
            gameFromDb.whitePlayerId,
            gameFromDb.blackPlayerId,
            gameFromDb.id,
            gameFromDb.startAt,
          );

          const { rows: moves } = await pool.query(
            `SELECT * FROM "Move" WHERE "gameId" = $1 ORDER BY "moveNumber" ASC`,
            [gameID],
          );

          game.seedMoves(moves);
          this.games.push(game);
        }

        socketManager.addUser(user, gameID);

        user.socket.emit("message", {
          type: "game_joined",
          gameID,
        });
      }

      // 🔥 EXIT
      if (message.type === "exit_game") {
        const game = this.games.find(
          (g) => g.gameID === message.payload.gameID,
        );
        if (!game) return;

        game.exitGame(user);
        this.removeGame(game.gameID);
      }
    });
  }
}
