import { Game } from "./Game.js";
import { socketManager } from "./socketManager.js";
import pool from "./database.js";

export class GameManager {
  constructor() {
    this.games = [];
    this.pendingGameID = null; //todo - make it an array to avoid race condition
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
    this.addHandler(user);
  }

  addHandler(user) {
    user.socket.on("message", async (message) => {
      if (message.type === "init_game") {
        if (this.pendingGameID) {
          const game = this.games.find((g) => g.gameID === this.pendingGameID);

          if (!game) {
            console.log("not found");
            return;
          }

          if (user.userId === game.P1UserID) {
            socketManager.broadcast(game.gameID, {
              type: "Game_alert",
              message: "Trying to connect to yourself",
            });
            return;
          }

          socketManager.addUser(user, game.gameID);
          await game?.updateSecondPlayer(user.userId);

          this.pendingGameID = null;
        } else {
          const game = new Game(user.userId, null);

          if (!game.gameID) {
            console.log("Game not created");
            return;
          }
          this.games.push(game);

          this.pendingGameID = game.gameID;
          socketManager.addUser(user, game.gameID);

          socketManager.broadcast(game.gameID, {
            type: "game_added",
            gameID: game.gameID,
          });
        }
      }

      if (message.type === "move") {
        const game = this.games.find(
          (g) => g.gameID === message.payload.gameID,
        );
        if (!game) {
          console.log("not found");
          return;
        }

        try {
          game.makeMove(user, message.payload.move);
        } catch (error) {
          console.log("Error while making move -", error);
          user.socket.emit("message", {
            type: "move_error",
            message: "Invalid move",
          });
        }

        if (game.result) {
          console.log("Result initialized calling removeGame");
          this.removeGame(game.gameID);
        }
      }

      if (message.type === "join_room") {
        const gameID = message.payload?.gameID;
        if (!gameID) {
          return;
        }

        let availableGame = this.games.find((g) => g.gameID === gameID);

        const { rows } = await pool.query(
          `SELECT * FROM "Game" WHERE id = $1`,
          [gameID],
        );

        if (!rows.length) {
          user.socket.emit("message", { type: "game_not_found" });
          return;
        }

        const gameFromDb = rows[0];

        if (availableGame && !availableGame.P2UserID) {
          socketManager.addUser(user, availableGame.gameID);
          await availableGame.updateSecondPlayer(user.userId);
          return;
        }

        if (gameFromDb.status !== "ONGOING") {
          user.socket.emit("message", {
            type: "game_ended",
            payload: {
              result: gameFromDb.result,
              status: gameFromDb.status,
              //add moves too, gameFromDb would not have moves, line - 128
              blackPlayer: {
                id: gameFromDb.blackPlayer.id,
                name: gameFromDb.blackPlayer.name,
              },
              whitePlayer: {
                id: gameFromDb.whitePlayer.id,
                name: gameFromDb.whitePlayer.name,
              },
            },
          });
          return;
        }
        if (!availableGame) {
          const game = new Game(
            gameFromDb.whitePlayerId,
            gameFromDb.blackPlayerId,
            gameFromDb.id,
            gameFromDb.startAt,
          );

          const { rows: moves } = await pool.query(
            `SELECT * FROM "Move" WHERE gameid = $1 ORDER BY movenumber ASC`,
            [gameID],
          );

          game.seedMoves(moves);
          this.games.push(game);
          availableGame = game;
        }

        user.socket.emit("message", {
          type: "game_joined",
          gameID: gameID,
        });

        socketManager.addUser(user, gameID);
      }

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

  removeUser(user) {
    this.users = this.users.filter((u) => u.userId !== user.userId);
    socketManager.removeUser(user);
  }

  removeGame(gameID) {
    this.games = this.games.filter((g) => g.gameID !== gameID);
  }
}
