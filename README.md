# ♟️ Real-Time Multiplayer Chess

A full-stack real-time chess platform built with **React, Node.js, Express, PostgreSQL, Socket.IO, and Chess.js**.

The project was built to simulate an actual online chess experience where two players can join a match, play in real time, reconnect without losing progress, and have every move persisted in the database.

---

## ✨ Features

### Real-Time Multiplayer Gameplay

- Instant move synchronization using WebSockets.
- Dedicated game rooms for isolated matches.
- Low-latency communication between players.
- Live game state updates.

### Complete Chess Rule Enforcement

Powered by **Chess.js**, supporting:

- Legal move validation
- Check detection
- Checkmate detection
- Stalemate
- Threefold repetition
- Draw conditions
- Castling
- Pawn promotion
- En passant
- Move history tracking

### Persistent Game State

A game never depends solely on client-side memory.

All important information is stored in PostgreSQL:

- Current board position (FEN)
- Move history
- Match result
- Time control
- Player information
- Game status

This allows players to:

- Refresh the browser
- Reconnect after disconnects
- Resume ongoing matches
- Recover game state without data loss

### Authentication System

Supports multiple authentication providers:

- Email & Password
- Google OAuth
- GitHub OAuth
- Bot Accounts

Features:

- JWT-based authentication
- Session persistence
- Secure password hashing with bcrypt
- Protected WebSocket connections

### Chess Clock Support

Built-in support for multiple time formats:

- Bullet
- Blitz
- Rapid
- Classical

Additional functionality:

- Server-authoritative timer management
- Time tracking per move
- Timeout detection
- Automatic game completion on time expiry

### Match Recovery

One of the primary goals of the project was ensuring that a page refresh does not destroy an active game.

The system automatically:

- Restores ongoing games
- Reloads move history
- Synchronizes board state
- Restores clock information
- Reconnects players to their active match

### Move Analytics Storage

Every move is persisted with:

- Source square
- Destination square
- SAN notation
- Move number
- Time taken
- Board state before move
- Board state after move

This enables:

- Replay functionality
- Future game analysis
- Move validation auditing
- PGN generation possibilities

---

# 🏗️ Architecture

The project is split into three independent layers.

```text
.
├── client/
│   ├── React + Vite Frontend
│   └── Chess UI & Game Experience
│
├── server/
│   ├── Express API
│   ├── Authentication
│   ├── Sessions
│   └── Database Operations
│
└── ws/
    ├── Socket.IO Layer
    ├── Room Management
    ├── Matchmaking Logic
    └── Real-Time Game Events
```

### Frontend (`client`)

Responsible for:

- Chess board rendering
- Authentication flows
- Match creation and joining
- Real-time updates
- Timer visualization
- Reconnection handling

Built with:

- React
- Vite
- React Router
- Tailwind CSS
- React Chessboard
- Axios

### Backend (`server`)

Responsible for:

- REST APIs
- Authentication
- Session management
- Database access
- Game lifecycle management

Built with:

- Node.js
- Express
- PostgreSQL
- Passport.js
- JWT
- bcrypt

### WebSocket Layer (`ws`)

Responsible for:

- Real-time communication
- Room creation
- Player connections
- Move broadcasting
- Timer synchronization
- Game recovery events

Built with:

- Socket.IO

---

# 🗄️ Database Design

The database was designed around long-term game persistence and recovery.

## User

Stores:

- User profile
- Authentication provider
- Rating
- Login information

## Game

Stores:

- Players
- Time control
- Current board position
- Starting position
- Result
- Opening
- Status

Game states include:

```text
ONGOING
COMPLETED
ABANDONED
TIME_UP
WAITING
```

## Move

Stores every move played during a match.

Information recorded:

```text
Move Number
From Square
To Square
SAN Notation
Time Taken
Board Before Move
Board After Move
Timestamp
```

---

# ⚡ Tech Stack

## Frontend

- React 19
- Vite
- Tailwind CSS
- React Router DOM
- React Chessboard
- Axios
- Socket.IO Client

## Backend

- Node.js
- Express
- PostgreSQL
- Passport.js
- JWT
- bcrypt
- express-session
- connect-pg-simple

## Real-Time Layer

- Socket.IO
- Chess.js

---

# 🔄 Game Flow

```text
Player Login
      │
      ▼
Create / Join Match
      │
      ▼
WebSocket Connection
      │
      ▼
Room Assignment
      │
      ▼
Move Validation
      │
      ▼
Database Persistence
      │
      ▼
Broadcast Update
      │
      ▼
Opponent Receives Move
      │
      ▼
Timer Update
      │
      ▼
Game End / Recovery
```

---

# 🎯 Key Engineering Challenges Solved

### Real-Time Synchronization

Ensuring both players always see the same board state.

### Reconnection Handling

Players can disconnect and reconnect without losing their game.

### Server-Side Authority

The server remains the source of truth for:

- Legal moves
- Timers
- Match state
- Results

### State Persistence

Every move is stored so games can be reconstructed at any point.

### WebSocket Authentication

Protected socket connections ensure only authorized players can participate in matches.

---

# 🚀 Future Improvements

- Elo rating system
- Matchmaking queue
- PGN export
- Spectator mode
- Chess engine integration
- Opening explorer
- Game analysis board
- Friend system
- Tournament support
- Global leaderboard

---

# 📚 Learning Outcomes

This project provided hands-on experience with:

- WebSocket architecture
- Real-time systems
- Stateful multiplayer applications
- Authentication and session management
- PostgreSQL schema design
- Event-driven backend development
- Game state synchronization
- Reconnection and fault-tolerance strategies

---

## License

This project is open-source and available under the MIT License.
