import { randomUUID } from "crypto";

export class User {
  constructor(socket) {
    this.socket = socket;
    this.socketID = socket.id;
    this.id = randomUUID();
  }
}

class SocketManager {
  constructor() {
    this.socketsmap = new Map(); // which users are in which room (room123 has a and b)
    this.roomsmap = new Map(); // which room a user is in (a in room123 b in room123)
  }
  setIO(io) {
    this.io = io;
  }
  static getInstance() {
    if (SocketManager.instance) {
      return SocketManager.instance;
    } else {
      SocketManager.instance = new SocketManager();
      return SocketManager.instance;
    }
  }
  addUser(user, roomID) {
    const existing = this.socketsmap.get(roomID) || [];
    this.socketsmap.set(roomID, [...existing, user]);
    this.roomsmap.set(user.id, roomID);

    user.socket.join(roomID);
    console.log("socket joined the room", roomID);
  }
  broadcast(roomID, message) {
    const users = this.socketsmap.get(roomID) || [];
    if (users.length === 0) {
      console.warn("Room empty or not found:", roomID);
      return;
    }

    this.io.to(roomID).emit("message", message);
  }

  removeUser(user) {
    const roomID = this.roomsmap.get(user.id);
    if (!roomID) {
      console.error("user not in any room");
      return;
    }
    const room = this.socketsmap.get(roomID) || [];
    const remainingUser = room.filter((u) => u.id !== user.id);
    this.socketsmap.set(roomID, remainingUser);

    if (this.socketsmap.get(roomID)?.length === 0) {
      this.socketsmap.delete(roomID);
    }
    console.log("socketManager removeUser working here...");

    this.roomsmap.delete(user.id);

    user.socket.leave(roomID);
    console.log("Socket left the room");
  }
}

export const socketManager = SocketManager.getInstance();
