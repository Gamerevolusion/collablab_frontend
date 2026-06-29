import { useState, useRef, useCallback, useEffect } from 'react';
import { auth } from '../firebase';

// Central API Gateway URL
const WS_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'ws://localhost:4000' 
  : 'wss://collablab-backend.onrender.com';

export function useCollabSocket({ isJoined, role, lobbyCode, studentId, studentName }) {
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const executionTimer = useRef(null);
  const [connectedStudents, setConnectedStudents] = useState([]);
  const [studentStreams, setStudentStreams] = useState({}); // { rollNumber: { fileName: code } }
  const [studentOutputs, setStudentOutputs] = useState({});
  const [terminalOutput, setTerminalOutput] = useState('Terminal standing by...');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [handRaises, setHandRaises] = useState(new Set());
  const [announcements, setAnnouncements] = useState([]);
  const [pasteAlerts, setPasteAlerts] = useState({});
  const [studentLanguages, setStudentLanguages] = useState({});
  const [studentActiveFiles, setStudentActiveFiles] = useState({}); // { rollNumber: fileName }
  const [studentFileList, setStudentFileList] = useState({}); // { rollNumber: [fileName, ...] }

  useEffect(() => {
    if (!isJoined) return;

    function connect() {
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.onopen = async () => {
        reconnectAttempts.current = 0;

        // CRIT-3: Send Firebase ID token for authentication
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const token = await currentUser.getIdToken(true);
            ws.send(JSON.stringify({
              type: 'AUTH',
              payload: { token }
            }));
          } else {
            // No user — send empty auth (dev mode will accept, prod will reject)
            ws.send(JSON.stringify({
              type: 'AUTH',
              payload: { token: '' }
            }));
          }
        } catch (err) {
          console.error('Failed to get auth token:', err);
          ws.send(JSON.stringify({
            type: 'AUTH',
            payload: { token: '' }
          }));
        }
      };

      ws.onmessage = (event) => {
        const packet = JSON.parse(event.data);
        const { type, payload } = packet;

        switch (type) {
          case 'AUTH_OK':
            // Authentication successful, now join the room
            ws.send(JSON.stringify({
              type: 'JOIN_ROOM',
              lobbyCode,
              payload: { rollNumber: role === 'professor' ? 'PROFESSOR' : studentId, name: studentName, role }
            }));
            break;
          case 'AUTH_ERROR':
            console.error('WebSocket auth failed:', payload);
            setError(typeof payload === 'string' ? payload : 'Authentication failed.');
            ws.close();
            break;
          case 'ERROR':
            setError(payload);
            break;
          case 'STUDENT_CONNECTED':
            setConnectedStudents(prev => {
              const exists = prev.find(s => s.rollNumber === payload.rollNumber);
              if (exists) return prev;
              return [...prev, { rollNumber: payload.rollNumber, name: payload.name }];
            });
            break;
          case 'STUDENT_DISCONNECTED':
            setConnectedStudents(prev => prev.filter(s => s.rollNumber !== payload.rollNumber));
            setHandRaises(prev => {
              const next = new Set(prev);
              next.delete(payload.rollNumber);
              return next;
            });
            break;
          case 'STUDENT_STREAM': {
            const rawDelta = payload.delta;
            const deltaStr = typeof rawDelta === 'object' && rawDelta !== null ? (rawDelta.code || '') : (rawDelta || '');
            const fileName = payload.fileName || 'main';
            const roll = payload.rollNumber;

            setStudentStreams(prev => ({
              ...prev,
              [roll]: { ...(prev[roll] || {}), [fileName]: deltaStr }
            }));
            setStudentActiveFiles(prev => ({ ...prev, [roll]: fileName }));
            setStudentFileList(prev => {
              const existing = prev[roll] || [];
              if (!existing.includes(fileName)) {
                return { ...prev, [roll]: [...existing, fileName] };
              }
              return prev;
            });
            if (payload.language) setStudentLanguages(prev => ({ ...prev, [roll]: payload.language }));
            break;
          }
          case 'EXECUTION_RESULT':
            if (role === 'student') {
              clearTimeout(executionTimer.current);
              setTerminalOutput(payload.output);
              setIsRunning(false);
            } else {
              setStudentOutputs(prev => ({ ...prev, [payload.rollNumber]: payload.output }));
            }
            break;
          case 'HAND_RAISE':
            setHandRaises(prev => new Set([...prev, payload.rollNumber]));
            break;
          case 'HAND_LOWER':
            setHandRaises(prev => {
              const next = new Set(prev);
              next.delete(payload.rollNumber);
              return next;
            });
            break;
          case 'ANNOUNCEMENT':
            setAnnouncements(prev => [...prev, { message: payload.message, timestamp: payload.timestamp, id: Date.now() }]);
            break;
          case 'PASTE_DETECTED':
            setPasteAlerts(prev => ({ ...prev, [payload.rollNumber]: { charCount: payload.charCount, timestamp: payload.timestamp } }));
            break;
          default:
            break;
        }
      };

      ws.onclose = () => {
        socketRef.current = null;
        // Attempt reconnection with exponential backoff (max 3 retries)
        if (reconnectAttempts.current < 3) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 8000);
          reconnectAttempts.current += 1;
          console.log(`WebSocket disconnected. Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/3)...`);
          reconnectTimer.current = setTimeout(connect, delay);
        } else {
          console.warn('WebSocket reconnection failed after 3 attempts.');
          setError('Connection lost. Please rejoin the session.');
        }
      };

      ws.onerror = () => {
        // onclose will fire after this, which handles reconnection
      };
    }

    connect();

    return () => {
      reconnectAttempts.current = 999; // prevent reconnection on intentional cleanup
      clearTimeout(reconnectTimer.current);
      clearTimeout(executionTimer.current);
      if (socketRef.current) socketRef.current.close();
      socketRef.current = null;
    };
  }, [isJoined, role, lobbyCode, studentId]);

  const sendMessage = useCallback((type, payload) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, lobbyCode, payload }));
    }
  }, [lobbyCode]);

  const syncCode = useCallback((code, language, fileName = 'main') => {
    sendMessage('SYNC_UPDATE', { code, language, fileName });
  }, [sendMessage]);

  const executeCode = useCallback((language, code, stdin = '') => {
    setIsRunning(true);
    setTerminalOutput('');
    sendMessage('EXECUTE_CODE', { language, code, stdin });
    // Auto-reset isRunning after 30s if no response arrives
    clearTimeout(executionTimer.current);
    executionTimer.current = setTimeout(() => {
      setIsRunning(false);
      setTerminalOutput(prev => prev || 'Execution timed out. Please try again.');
    }, 30000);
  }, [sendMessage]);

  const raiseHand = useCallback(() => {
    sendMessage('HAND_RAISE', { rollNumber: studentId });
  }, [sendMessage, studentId]);

  const lowerHand = useCallback(() => {
    sendMessage('HAND_LOWER', { rollNumber: studentId });
  }, [sendMessage, studentId]);

  const acknowledgeHand = useCallback((targetStudentId) => {
    setHandRaises(prev => {
      const next = new Set(prev);
      next.delete(targetStudentId);
      return next;
    });
    sendMessage('HAND_LOWER', { rollNumber: targetStudentId });
  }, [sendMessage]);

  const sendAnnouncement = useCallback((message) => {
    sendMessage('ANNOUNCEMENT', { message });
  }, [sendMessage]);

  const dismissAnnouncement = useCallback((id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  const reportPaste = useCallback((charCount) => {
    sendMessage('PASTE_DETECTED', { rollNumber: studentId, charCount });
  }, [sendMessage, studentId]);

  const dismissPasteAlert = useCallback((targetId) => {
    setPasteAlerts(prev => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
  }, []);

  return {
    connectedStudents,
    studentStreams,
    studentOutputs,
    terminalOutput,
    setTerminalOutput,
    isRunning,
    error,
    handRaises,
    announcements,
    pasteAlerts,
    studentLanguages,
    studentActiveFiles,
    studentFileList,
    syncCode,
    executeCode,
    raiseHand,
    lowerHand,
    acknowledgeHand,
    sendAnnouncement,
    dismissAnnouncement,
    reportPaste,
    dismissPasteAlert,
  };
}
