# CodeSync — System Architecture & Technical Specifications

## 1. Overview
**CodeSync** is a production-ready real-time collaborative code editor web application. Multiple developers can join synchronized coding rooms, collaborate simultaneously with live multi-cursor presence, execute code securely in multi-language sandboxes, manage version history snapshots, and persist rooms to MongoDB.

---

## 2. High-Level Architecture (HLD)

```
                            [ Client (Browser) ]
                                     |
                 +-------------------+-------------------+
                 | HTTPS                             | WSS (WebSocket)
                 v                                   v
       [ Express REST API ]                [ Socket.io Gateway ]
         - Auth (JWT / bcrypt)               - Real-Time Room Engine
         - Room Management                   - Code Broadcast Buffer
         - Version Control Snapshots         - Multi-Cursor Synchronization
         - Execution Dispatcher              - Presence & Typing Indicators
                 |                                   |
                 +-------------------+---------------+
                                     |
                                     v
                       [ Node.js Backend Services ]
                                     |
          +--------------------------+--------------------------+
          |                                                     |
          v                                                     v
 [ MongoDB Atlas ]                                      [ Judge0 Engine ]
  - User Store                                           - Sandboxed Execution
  - Room Store                                           - Multi-Language Runtime
  - Version History                                      - Stdin / Stdout Buffers
  - Execution History                                    - Resource Limits
```

---

## 3. Tech Stack
- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), Socket.io Client, Axios, Lucide Icons.
- **Backend**: Node.js, Express.js, Socket.io, Mongoose (MongoDB ODM), JSON Web Tokens (JWT), bcryptjs, Helmet, CORS, Express-Rate-Limit.
- **Execution**: Judge0 REST API (sandboxed remote compiler/runtime) with fallback safe handlers.
- **Testing**: Jest, Supertest.

---

## 4. Real-Time Protocol Specification (Socket.io)

### Connection Handshake
- Authenticated via JWT token query/auth header.
- Sockets join specific room channels (`room_${roomId}`).

### Event Registry
| Event Name | Direction | Payload Schema | Description |
|---|---|---|---|
| `join-room` | Client -> Server | `{ roomId: string, user: { id, name, avatar, color } }` | Client joins room channel |
| `room-state` | Server -> Client | `{ room: object, activeUsers: Array }` | Initial synchronized room payload |
| `user-joined` | Server -> Broadcast | `{ user: object }` | Alerts peers of newly joined user |
| `user-left` | Server -> Broadcast | `{ userId: string, name: string }` | Alerts peers when user leaves or disconnects |
| `code-change` | Client -> Server | `{ roomId: string, code: string, senderId: string }` | User code mutation (debounced 30ms) |
| `sync-code` | Server -> Broadcast | `{ code: string, updatedBy: string }` | Relayed to all peers in the room |
| `cursor-change` | Client -> Server | `{ roomId: string, position: { lineNumber, column }, user: object }` | Throttled cursor position (50ms) |
| `cursor-update` | Server -> Broadcast | `{ userId: string, name: string, color: string, position: object }` | Remote cursor location update |
| `language-change` | Client -> Server | `{ roomId: string, language: string }` | Language switch event |
| `language-update` | Server -> Broadcast | `{ language: string, updatedBy: string }` | Relayed language change |
| `typing-start` | Client -> Server | `{ roomId: string, userId: string, name: string }` | Typing activity indicator |
| `typing-stop` | Client -> Server | `{ roomId: string, userId: string }` | Typing activity clear |

---

## 5. Database Schema Blueprint

```
+-------------------------------------------------------------+
|                          User                               |
+-------------------------------------------------------------+
| _id          : ObjectId                                     |
| name         : String (required, trim)                      |
| email        : String (required, unique, indexed, lowercase)|
| passwordHash : String (required)                            |
| avatar       : String (default generated avatar)            |
| createdAt    : Date                                         |
| updatedAt    : Date                                         |
+-------------------------------------------------------------+

+-------------------------------------------------------------+
|                          Room                               |
+-------------------------------------------------------------+
| _id          : ObjectId                                     |
| roomId       : String (unique index, e.g. CS-8F3K29)        |
| name         : String (required)                            |
| owner        : ObjectId (ref: 'User', indexed)              |
| language     : String (enum: ['javascript', 'python', ...]) |
| code         : String (current persistent code)             |
| participants : [{ user: ObjectId, role: String }]           |
| isPublic     : Boolean (default: true)                      |
| createdAt    : Date                                         |
| updatedAt    : Date                                         |
+-------------------------------------------------------------+

+-------------------------------------------------------------+
|                       RoomVersion                           |
+-------------------------------------------------------------+
| _id          : ObjectId                                     |
| roomId       : String (indexed)                             |
| code         : String (snapshot code)                       |
| language     : String                                       |
| title        : String (optional snapshot label)             |
| savedBy      : ObjectId (ref: 'User')                       |
| createdAt    : Date (indexed)                               |
+-------------------------------------------------------------+

+-------------------------------------------------------------+
|                    ExecutionHistory                         |
+-------------------------------------------------------------+
| _id          : ObjectId                                     |
| roomId       : String (indexed)                             |
| userId       : ObjectId (ref: 'User', indexed)              |
| language     : String                                       |
| stdin        : String                                       |
| stdout       : String                                       |
| stderr       : String                                       |
| status       : String (e.g. 'Accepted', 'Compile Error')    |
| executionTime: Number (milliseconds)                        |
| memoryUsage  : Number (KB)                                  |
| createdAt    : Date (indexed)                               |
+-------------------------------------------------------------+
```

---

## 6. Secure Code Execution (Judge0 Pipeline)

To protect the server from Arbitrary Code Execution (RCE), fork bombs, and network access violations:
1. Untrusted code is never executed via Node.js `eval()`, `vm`, or local `child_process`.
2. Execution requests are routed to Judge0 API in an isolated containerized environment.
3. Strict execution caps are enforced:
   - Execution Time Limit: 5.0 seconds
   - Memory Limit: 128 MB
   - Payload Limit: 64 KB
4. Base64 encoding is utilized for all source code, stdin, and stdout streams to prevent shell character corruption.

---

## 7. Performance & Scaling Architecture

- **High-Frequency Code Sync**: Client debouncing (30ms) prevents socket event saturation; Server relays events directly without disk I/O on keystrokes.
- **Multi-Cursor Throttling**: Cursor broadcasts are throttled to max 20 events/sec (50ms throttle window).
- **Periodic Snapshot / Auto-save**: In-memory active room buffers are periodically flushed to MongoDB (3000ms debounce), saving 99%+ of database write operations.
- **Horizontal Scaling (Redis Adapter)**: Socket.io can easily connect to `@socket.io/redis-adapter` for multi-instance cluster deployment behind an NGINX / Cloud load balancer.
