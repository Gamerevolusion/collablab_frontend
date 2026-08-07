/**
 * Backend API base URL (HTTP)
 */
export const BACKEND_HTTP_URL =
  import.meta.env.VITE_BACKEND_HTTP_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'
    : 'https://collablab-backend.onrender.com');

/**
 * Backend WebSocket URL
 */
export const BACKEND_WS_URL =
  import.meta.env.VITE_BACKEND_WS_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'ws://localhost:4000'
    : 'wss://collablab-backend.onrender.com');
