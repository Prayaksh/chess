import { socketManager } from "./socketManager.js";
import { Game } from "./Game.js";

export class GameManager {
  constructor() {
    this.games = [];
    this.pendingGameID = null;
    this.users = [];
  }
  addUser(user) {
    console.log("adduser here");
    this.users.push(user);
    this.addHandler(user);
  }
  removeUser(socket) {
    const user = this.users.find((user) => user.socket === socket);
    if (!user) {
      console.error("user not found");
      return;
    }
    console.log("gameManager removeUser working here...");
    this.users = this.users.filter((user) => user.socket !== socket);
    socketManager.removeUser(user);
  }
  removeGame(gameID) {
    console.log("remove game here");
    this.games = this.games.filter((g) => g.gameID !== gameID);
  }

  addHandler(user) {
    console.log("addHandler here");
    user.socket.on("message", async (message) => {
      if (!message) return;

      console.log("Socket messaged - ", message);
      console.log("Socket message datatype - ", typeof message);
      console.log("socket message type -", message.type);
      if (message.type === "init_game" && user.gameID) {
        user.socket.emit("message", {
          type: "player_alert",
          payload: { message: "Already in a game" },
        });
        return;
      }
      if (message.type === "init_game") {
        if (this.pendingGameID) {
          const game = this.games.find((g) => g.gameID === this.pendingGameID);
          if (!game) {
            console.error("Cant find pending game");
            this.pendingGameID = null;
            return;
          }
          if (user.id === game.P1UserID) {
            socketManager.broadcast(game.gameID, {
              type: "game_alert",
              payload: { message: "Trying to connect to yourself?" },
            });
            return;
          }

          socketManager.addUser(user, game.gameID);
          user.gameID = game.gameID;
          await game?.updateSecondPlayer(user.id);
          this.pendingGameID = null;
        } else {
          const game = new Game(user.id, null); //waiting for the second player
          this.games.push(game);
          this.pendingGameID = game.gameID;
          socketManager.addUser(user, game.gameID);
          user.gameID = game.gameID;
          socketManager.broadcast(game.gameID, {
            type: "game_added",

            payload: {
              message: "Waiting for other player to join",
              gameID: game.gameID,
            },
          });
          console.log("user created game and waiting for other player");
        }
      }
      if (message.type === "move") {
        const gameID = message.payload.gameID;
        console.log("got the gameID");
        const game = this.games.find((game) => game.gameID === gameID);
        if (game) {
          game.makeMove(user, message.payload.move);
          console.log(message.payload.move);
          if (game.result) {
            this.removeGame(game.gameID);
            console.log("game removed");
          }
        }
      }
      if (message.type === "exit_game") {
        const gameID = message.payload.gameID;
        const game = this.games.find((game) => game.gameID === gameID);
        if (game) {
          game.exitGame(user);
          this.removeGame(game.gameID);
        }
        user.gameID = null;
      }
    });
  }
}
