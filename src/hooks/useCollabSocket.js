import { useState, useRef, useCallback, useEffect } from 'react';

// Central API Gateway URL
const WS_URL = 'wss://collablab-backend.onrender.com';

export function useCollabSocket({ isJoined, role, lobbyCode, studentId, studentName }) {
  const socketRef = useRef(null);
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

    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        lobbyCode,
        payload: { rollNumber: role === 'professor' ? 'PROFESSOR' : studentId, name: studentName, role }
      }));
    };

    ws.onmessage = (event) => {
      const packet = JSON.parse(event.data);
      const { type, payload } = packet;

      switch (type) {
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

          // Store per-file content
          setStudentStreams(prev => ({
            ...prev,
            [roll]: { ...(prev[roll] || {}), [fileName]: deltaStr }
          }));

          // Track active file
          setStudentActiveFiles(prev => ({ ...prev, [roll]: fileName }));

          // Track file list
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
    };

    return () => {
      ws.close();
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
