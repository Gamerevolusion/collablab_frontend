# CollabLab — Frontend

A real-time collaborative coding lab platform for professors and students. Built with React 19, Vite, Monaco Editor, and Yjs CRDT.

## Features

- **Live Collaborative Editing** — Real-time code sync between professors and students using Yjs CRDT with awareness cursors
- **Code Execution** — Students can run Python and JavaScript code directly from the editor
- **Professor Dashboard** — Monitor all students' code in a grid view, or jump into a collaborative editing session
- **Hand Raise** — Students can raise their hand to request help; professors see indicators in the roster and monitoring grid
- **Dark/Light Theme** — Toggle between dark and light themes

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Vite 8 | Build tool & dev server |
| Monaco Editor | Code editor |
| Yjs + y-websocket | CRDT-based real-time collaboration |
| TailwindCSS 4 | Styling |
| Lucide React | Icons |

## Architecture

The frontend connects to two WebSocket servers:
1. **Gateway Server** (`collablab-backend`) — Lobby management, code execution, hand-raise signaling
2. **CRDT Sync Engine** — Yjs document sync for real-time collaborative editing

## Project Structure

```
src/
├── App.jsx                    # Root shell component
├── main.jsx                   # Entry point
├── index.css                  # Global styles
├── components/
│   ├── LoginScreen.jsx        # Login / join form
│   ├── StudentWorkspace.jsx   # Student editor + terminal
│   ├── ProfessorDashboard.jsx # Roster + collab editor + grid
│   └── MonitorGrid.jsx        # Student code monitoring cards
└── hooks/
    └── useCollabSocket.js     # Custom WebSocket hook
```
