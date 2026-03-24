export class User {
  constructor(socket, userId, name) {
    this.socket = socket;
    this.userId = userId;
    this.socketId = socket.id;
    this.name = name;
  }
}
class SocketManager {
  constructor() {
    this.rooms = new Map(); // userId -> roomId
  }

  setIO(io) {
    this.io = io;
  }

  static getInstance() {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  addUser(user, roomId) {
    user.socket.join(roomId);
    this.rooms.set(user.userId, roomId);
  }

  removeUser(user) {
    const roomId = this.rooms.get(user.userId);
    if (!roomId) return;

    user.socket.leave(roomId);
    this.rooms.delete(user.userId);
  }

  broadcast(roomId, message) {
    this.io.to(roomId).emit("message", message);
  }
}

export const socketManager = SocketManager.getInstance();
