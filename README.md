# CodeSync — Real-Time Collaborative Code Editor

<div align="center">

![CodeSync Banner](https://img.shields.io/badge/CodeSync-Real--Time%20Collaborative%20Editor-6366f1?style=for-the-badge&logo=code&logoColor=white)

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**A production-ready, full-stack collaborative code editor with real-time multi-user synchronization, multi-language execution, version history, and secure authentication.**

[Live Demo](#) · [API Docs](#api-reference) · [Architecture](#system-architecture) · [Quick Start](#quick-start)

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Socket Event Dictionary](#socket-event-dictionary)
- [Deployment](#deployment)
- [Testing](#testing)
- [Security](#security)
- [Scalability](#scalability)
- [Roadmap](#roadmap)

---

## Features

| Feature | Details |
|---|---|
| 🔐 **Authentication** | JWT-based auth with 7-day tokens, bcryptjs password hashing |
| 🏠 **Room System** | Create/join rooms with unique `CS-XXXXXX` IDs, public/private modes |
| ⚡ **Real-Time Sync** | Bidirectional code sync via Socket.io with echo loop prevention |
| 👥 **Multi-Cursor** | Live collaborator cursors rendered as Monaco ContentWidgets |
| 🖊️ **Typing Indicators** | Real-time "User X is typing..." indicators via throttled socket events |
| 💾 **Code Persistence** | Auto-save (3s debounce) + manual Ctrl+S → MongoDB Atlas |
| 🚀 **Code Execution** | Judge0 sandbox (7 languages) with stdin/stdout and telemetry metrics |
| 📜 **Version History** | Milestone snapshots with Monaco visual diff viewer (side-by-side) |
| 🔄 **One-Click Restore** | Revert to any saved version; broadcasts to all room peers via Socket.io |
| 🛡️ **Security** | Helmet headers, Express rate limiting, NoSQL injection sanitization, payload size caps |
| 🐳 **Docker Ready** | Multi-stage Dockerfiles, docker-compose full-stack orchestration |
| ✅ **Test Suite** | 13 Jest + Supertest integration tests across auth, rooms, and execution |

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | Component-based UI framework |
| Vite | 6 | Lightning-fast dev server & bundler |
| React Router | 6 | Client-side routing |
| Tailwind CSS | 3 | Utility-first CSS with custom design tokens |
| Monaco Editor | latest | VS Code-powered code editor with IntelliSense |
| Socket.io-client | 4 | WebSocket client for real-time sync |
| Axios | 1.7 | HTTP client with interceptors |
| Lucide React | latest | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 | JavaScript runtime |
| Express.js | 4 | REST API framework |
| Socket.io | 4 | WebSocket server with rooms/namespaces |
| MongoDB | 7 | Document database for rooms, versions, history |
| Mongoose | 8 | ODM with schema validation & middleware |
| JSON Web Token | 9 | Stateless authentication |
| bcryptjs | 2 | Password hashing (12 salt rounds) |
| Helmet | 8 | HTTP security headers |
| express-rate-limit | 7 | API rate limiting |
| Judge0 API | CE | Multi-language sandboxed code execution |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (React + Vite)                       │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────┐ │
│  │  Monaco      │  │  Socket.io     │  │  React Router +     │ │
│  │  Editor +    │  │  Client Hook   │  │  Auth Context       │ │
│  │  DiffEditor  │  │  useRoomSocket │  │  (JWT in localStorage│ │
│  └──────┬───────┘  └───────┬────────┘  └─────────┬───────────┘ │
│         │                  │ WebSocket            │ HTTP        │
└─────────┼──────────────────┼──────────────────────┼─────────────┘
          │                  │                      │
          │           ┌──────▼──────────────────────▼────────────┐
          │           │         EXPRESS.JS SERVER (Port 5000)     │
          │           │                                           │
          │           │  ┌────────────┐  ┌─────────────────────┐ │
          │           │  │ REST Routes│  │  Socket.io Server   │ │
          │           │  │ /api/auth  │  │  roomHandler.js     │ │
          │           │  │ /api/rooms │  │  activeRooms Map    │ │
          │           │  └─────┬──────┘  └────────┬────────────┘ │
          │           │        │                   │              │
          │           │  ┌─────▼───────────────────▼──────────┐  │
          │           │  │        MIDDLEWARE PIPELINE           │  │
          │           │  │  Helmet → CORS → RateLimit →        │  │
          │           │  │  Sanitize → Auth JWT → Validate     │  │
          │           │  └─────────────────────────────────────┘  │
          │           │                                           │
          │           └──────────────┬──────────────────────────┘
          │                          │
          │            ┌─────────────▼──────────────┐
          │            │         MONGODB             │
          │            │  users  rooms  roomversions │
          │            │  executionhistory           │
          │            └─────────────────────────────┘
          │
   ┌──────▼────────────┐
   │   JUDGE0 API      │
   │  (Code Execution) │
   │  JS/TS/Py/C++     │
   │  C/Java/Go        │
   └───────────────────┘
```

### Data Flow — Real-Time Code Sync

```
User A types code
      │
      ▼
Monaco onChange()
      │
      ▼
emitCodeChange(code)  ──── Socket.io ────►  Server roomHandler
      │                                           │
      │                                    broadcast to room
      │                                    (excluding sender)
      │                                           │
      │                             ◄─── sync-code event ───
      │
isRemoteChangeRef = true  (prevents echo loop)
      │
      ▼
Editor.setValue(remoteCode)
```

### Code Execution Pipeline

```
User clicks "Run" / Ctrl+Enter
      │
      ▼
POST /api/rooms/:roomId/execute
      │
      ├── validateExecute() — size, language checks
      ├── executionLimiter() — 20 runs/min/IP
      │
      ▼
ExecutionService.executeCode()
      │
      ├── JUDGE0_API_KEY set?
      │     ├── YES → Base64 encode → POST to Judge0 → poll result
      │     └── NO  → fallbackSafeExecution() (isolated JS sandbox)
      │
      ▼
ExecutionHistory.create() → MongoDB
      │
      ▼
Return { stdout, stderr, status, executionTime, memoryUsage }
      │
      ▼
ExecutionPanel renders output + telemetry badges
```

---

## Project Structure

```
Code_editor/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/
│   │   │   │   ├── CodeEditor.jsx         # Monaco editor + ContentWidgets
│   │   │   │   ├── EditorToolbar.jsx      # Run, Save, History, Language
│   │   │   │   └── EditorSkeleton.jsx     # Loading skeleton
│   │   │   ├── execution/
│   │   │   │   └── ExecutionPanel.jsx     # Terminal console + stdin
│   │   │   ├── history/
│   │   │   │   └── VersionHistoryModal.jsx # Diff viewer + restore
│   │   │   ├── modals/
│   │   │   │   └── ShortcutsModal.jsx     # Keyboard shortcuts cheatsheet
│   │   │   ├── presence/
│   │   │   │   └── PresenceSidebar.jsx    # Active collaborators drawer
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx            # JWT auth state + axios interceptor
│   │   ├── hooks/
│   │   │   └── useRoomSocket.js           # Socket.io real-time hook
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx          # Room grid + metrics + search
│   │   │   ├── CreateRoomPage.jsx
│   │   │   ├── JoinRoomPage.jsx
│   │   │   ├── RoomPage.jsx               # Main collaborative workspace
│   │   │   └── ProfilePage.jsx
│   │   └── services/
│   │       └── api.js                     # Axios instance + interceptors
│   ├── vercel.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── constants.js               # Language configs, Judge0 IDs
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── roomController.js
│   │   │   ├── executionController.js
│   │   │   └── versionController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js          # JWT verification
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js             # Tiered rate limits
│   │   │   ├── sanitizeMiddleware.js      # NoSQL injection defense
│   │   │   └── validationMiddleware.js    # Input schema validation
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Room.js
│   │   │   ├── RoomVersion.js
│   │   │   └── ExecutionHistory.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── roomRoutes.js
│   │   ├── services/
│   │   │   └── executionService.js        # Judge0 + safe fallback
│   │   ├── sockets/
│   │   │   └── roomHandler.js             # Socket.io room events
│   │   ├── utils/
│   │   │   ├── generateToken.js
│   │   │   ├── roomIdGenerator.js
│   │   │   └── test*.js                   # Integration test scripts
│   │   ├── app.js                         # Express app factory
│   │   └── server.js                      # HTTP + Socket.io bootstrap
│   ├── tests/
│   │   ├── setup.js
│   │   ├── auth.test.js
│   │   ├── rooms.test.js
│   │   └── execution.test.js
│   ├── Dockerfile
│   └── .env.example
│
├── docs/
│   └── ARCHITECTURE.md
├── docker-compose.yml
├── render.yaml
└── .gitignore
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- MongoDB (local or Atlas URI)
- npm ≥ 10

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/codesync.git
cd codesync

# Install all dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Configure Environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env and set MONGO_URI and JWT_SECRET

# Client
cp client/.env.example client/.env.local
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
npm --prefix server run dev

# Terminal 2 — Frontend (port 5173)
npm --prefix client run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Run with Docker Compose

```bash
docker compose up --build
# App → http://localhost:3000 | API → http://localhost:5000
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `5000` | Express server port |
| `MONGO_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | HS256 signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry duration |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed CORS origin |
| `JUDGE0_API_KEY` | No | — | RapidAPI key for Judge0 (omit for JS sandbox fallback) |
| `JUDGE0_API_URL` | No | `https://judge0-ce.p.rapidapi.com` | Judge0 base URL |

### Client (`client/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes** | Backend REST API base URL |
| `VITE_SOCKET_URL` | **Yes** | Socket.io server URL |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new user account |
| `POST` | `/api/auth/login` | ❌ | Login and receive JWT token |
| `GET` | `/api/auth/me` | ✅ | Get authenticated user profile |
| `PUT` | `/api/auth/profile` | ✅ | Update user name / avatar |

#### POST /api/auth/register

```json
// Request Body
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123!"
}

// Response 201
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com" }
}
```

### Rooms

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/rooms` | ✅ | Create a new room |
| `GET` | `/api/rooms` | ✅ | List all rooms user is a member of |
| `GET` | `/api/rooms/:roomId` | ✅ | Get room details + current code |
| `PUT` | `/api/rooms/:roomId` | ✅ | Update room name/settings |
| `DELETE` | `/api/rooms/:roomId` | ✅ | Delete room (owner only) |
| `POST` | `/api/rooms/:roomId/join` | ✅ | Join room as participant |
| `POST` | `/api/rooms/:roomId/leave` | ✅ | Leave room |
| `POST` | `/api/rooms/:roomId/save` | ✅ | Save code + create version snapshot |

### Code Execution

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| `POST` | `/api/rooms/:roomId/execute` | ✅ | 20/min | Execute code via Judge0 sandbox |
| `GET` | `/api/rooms/:roomId/executions` | ✅ | — | Fetch execution telemetry history |

#### POST /api/rooms/:roomId/execute

```json
// Request Body
{
  "code": "console.log('Hello, World!');",
  "language": "javascript",
  "stdin": ""
}

// Response 200
{
  "success": true,
  "data": {
    "stdout": "Hello, World!\n",
    "stderr": "",
    "status": "Accepted",
    "executionTime": 42,
    "memoryUsage": 3756
  }
}
```

### Version History

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/rooms/:roomId/versions` | ✅ | List all saved code snapshots |
| `GET` | `/api/rooms/:roomId/versions/:versionId` | ✅ | Get a specific snapshot |
| `POST` | `/api/rooms/:roomId/versions/:versionId/restore` | ✅ | Restore code from snapshot |

---

## Socket Event Dictionary

All events are scoped to a Socket.io room identified by `roomId`.

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, user }` | Join collaborative session |
| `leave-room` | `{ roomId }` | Leave session |
| `code-change` | `{ roomId, code }` | Broadcast code update |
| `language-change` | `{ roomId, language }` | Broadcast language switch |
| `cursor-change` | `{ roomId, position, selection }` | Send cursor position (throttled 50ms) |
| `typing-start` | `{ roomId }` | Broadcast typing indicator |
| `typing-stop` | `{ roomId }` | Stop typing indicator |
| `code-saved` | `{ roomId, versionTitle, savedBy }` | Notify peers of new snapshot |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room-state` | `{ code, language, activeUsers }` | Hydrate new joiner with current state |
| `user-joined` | `{ user }` | Peer joined the room |
| `user-left` | `{ userId }` | Peer left the room |
| `sync-code` | `{ code }` | Receive peer's code change |
| `language-update` | `{ language }` | Receive language switch |
| `cursor-update` | `{ userId, name, color, position }` | Peer cursor position update |
| `user-typing` | `{ userId, name, isTyping }` | Typing indicator broadcast |
| `code-saved-alert` | `{ versionTitle, savedBy }` | Version snapshot notification |

---

## Deployment

### Backend → Render.com (Free Tier)

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Set **Root Directory**: `server`
4. **Build Command**: `npm install`
5. **Start Command**: `node src/server.js`
6. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`
7. Deploy — Render auto-detects `render.yaml`

### Frontend → Vercel

```bash
cd client
npx vercel --prod
```

In Vercel Project Settings → Environment Variables:
- `VITE_API_URL` → `https://your-api.onrender.com/api`
- `VITE_SOCKET_URL` → `https://your-api.onrender.com`

---

## Testing

```bash
# Jest integration test suite (13 tests)
npm --prefix server test

# Individual Superscript tests
node server/src/utils/testAuth.js
node server/src/utils/testRooms.js
node server/src/utils/testExecution.js
node server/src/utils/testVersions.js
node server/src/utils/testSecurity.js
node server/src/utils/testSocketSync.js
```

**Test Coverage:**

| Suite | Tests | Coverage |
|---|---|---|
| `auth.test.js` | 6 | Registration, Login, JWT guard, duplicate prevention |
| `rooms.test.js` | 4 | Create, Read, Save, Version history |
| `execution.test.js` | 3 | Execute, Stdin, Telemetry history |
| Socket Tests | Functional | Join, sync, language, leave, cursor |
| Security Tests | Functional | NoSQL injection, validation, payload size |

---

## Security

| Layer | Implementation |
|---|---|
| **Headers** | Helmet.js — XSS, MIME sniffing, clickjacking protection |
| **CORS** | Strict origin whitelist via `CLIENT_URL` env variable |
| **Rate Limiting** | 300 req/15min global · 25/15min auth · 20/min execution |
| **NoSQL Injection** | Custom sanitizer strips `$` operators from all inputs |
| **Input Validation** | Email regex, password length, code size cap (64KB), language enum |
| **Password Storage** | bcryptjs with 12 salt rounds (never stored in plaintext) |
| **JWT** | HS256, 7-day expiry, `Bearer` scheme, stripped from `toJSON()` |
| **Execution** | Base64 encoded I/O, Judge0 resource caps (5s CPU, 128MB RAM) |

---

## Scalability

The current architecture supports horizontal scaling with these enhancements for production:

| Concern | Current | Production-Scale Solution |
|---|---|---|
| **Socket.io State** | In-memory `activeRooms` Map | Redis Adapter (`socket.io-redis`) |
| **Code Execution** | Judge0 cloud API | Self-hosted Judge0 cluster or AWS Lambda |
| **Database** | MongoDB single node | MongoDB Atlas M10+ with replica sets |
| **Load Balancing** | Single Node process | PM2 cluster mode + NGINX upstream |
| **Media/Assets** | None | AWS S3 + CloudFront CDN |

---

## Roadmap

- [ ] GitHub OAuth & Google SSO
- [ ] Room chat sidebar (Socket.io messages)
- [ ] Operational Transform (OT) or CRDT conflict resolution
- [ ] AI-powered code completion via Copilot / Gemini API
- [ ] Mobile-responsive layout
- [ ] Room sharing via invite link with expiry
- [ ] Admin dashboard for room moderation

---

<div align="center">

Built with ❤️ as a production-quality portfolio project demonstrating full-stack software engineering skills.

**React · Node.js · Express · Socket.io · MongoDB · Monaco Editor · Judge0**

</div>
"# CodeSync-Real-Time-Collaborative-Code-Editor" 
