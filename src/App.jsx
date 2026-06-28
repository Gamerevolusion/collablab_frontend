import React, { useState } from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import StudentDashboard from './components/StudentDashboard';
import ProfessorLobby from './components/ProfessorLobby';
import StudentWorkspace from './components/StudentWorkspace';
import ProfessorDashboard from './components/ProfessorDashboard';
import AdminDashboard from './components/AdminDashboard';
import { useCollabSocket } from './hooks/useCollabSocket';
import {
  doc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp,
  query,
  where,
  limit,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';

function AppContent() {
  const { user, userProfile, loading, signOut } = useAuth();
  const [isDark, setIsDark] = useState(true);

  const [inSession, setInSession] = useState(false);
  const [lobbyCode, setLobbyCode] = useState('');
  const [sessionDocId, setSessionDocId] = useState(null);
  const [participantDocId, setParticipantDocId] = useState(null);
  const [joinError, setJoinError] = useState('');

  const [localCode, setLocalCode] = useState('print("System Online.")\n');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [isHandRaised, setIsHandRaised] = useState(false);

  const role = userProfile?.role || 'student';
  const studentId = role === 'student'
    ? (userProfile?.rollNumber || user?.uid?.substring(0, 8) || '')
    : 'PROFESSOR';
  const studentName = role === 'student'
    ? (userProfile?.displayName || user?.displayName || 'Unknown Student')
    : 'Professor';

  const {
    connectedStudents,
    studentStreams,
    studentOutputs,
    terminalOutput,
    setTerminalOutput,
    isRunning,
    error: socketError,
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
  } = useCollabSocket({ isJoined: inSession, role, lobbyCode, studentId, studentName });

  const handleJoinSession = async (code) => {
    setJoinError('');
    if (role === 'student') {
      try {
        // First, validate the lobby code exists in active sessions
        const sessQ = query(
          collection(db, 'sessions'),
          where('lobbyCode', '==', code),
          where('endedAt', '==', null),
          limit(1)
        );
        const sessSnap = await getDocs(sessQ);
        
        if (sessSnap.empty) {
          setJoinError('Invalid or expired lobby code. Please check with your professor.');
          return;
        }

        const sessData = sessSnap.docs[0];
        const activeSessionId = sessData.id;
        const sessionSemester = sessData.data().semester || null;
        const sessionSubject = sessData.data().subject || '';
        const sessionProfessorName = sessData.data().professorName || '';

        // Check if student already has an active participation in this session
        let existingParticipantDoc = null;
        try {
          const partQ = query(
            collection(db, 'sessionParticipants'),
            where('sessionId', '==', activeSessionId),
            where('studentUid', '==', user.uid),
            where('status', 'in', ['in_progress', 'pending']),
            limit(1)
          );
          const partSnap = await getDocs(partQ);
          if (!partSnap.empty) {
            existingParticipantDoc = partSnap.docs[0];
          }
        } catch (err) {
          console.warn('Could not check existing participation:', err);
        }

        setLobbyCode(code);
        setInSession(true);

        try {
          if (existingParticipantDoc) {
            // Reuse existing participation record - just update status to in_progress
            await updateDoc(doc(db, 'sessionParticipants', existingParticipantDoc.id), {
              status: 'in_progress',
              leftAt: null,
            });
            setParticipantDocId(existingParticipantDoc.id);
          } else {
            // Create new participation record
            const partDoc = await addDoc(collection(db, 'sessionParticipants'), {
              lobbyCode: code,
              sessionId: activeSessionId,
              studentUid: user.uid,
              studentName: userProfile?.displayName || '',
              rollNumber: userProfile?.rollNumber || '',
              semester: sessionSemester,
              subject: sessionSubject,
              joinedAt: serverTimestamp(),
              leftAt: null,
              status: 'in_progress',
              languages: [],
              professorName: sessionProfessorName,
              codeSnapshots: {}, // Store code per file per language
            });
            setParticipantDocId(partDoc.id);
          }
        } catch (err) {
          console.error('Failed to record session participation:', err);
        }
      } catch (err) {
        console.error('Failed to validate lobby code:', err);
        setJoinError('Something went wrong. Please try again.');
      }
    } else {
      // Professor/admin just join directly (they create sessions)
      setLobbyCode(code);
      setInSession(true);
    }
  };

  const handleCreateSession = async (code, semester, subject) => {
    setLobbyCode(code);
    setInSession(true);

    try {
      const sessDoc = await addDoc(collection(db, 'sessions'), {
        lobbyCode: code,
        professorUid: user.uid,
        professorName: userProfile?.displayName || '',
        startedAt: serverTimestamp(),
        endedAt: null,
        languages: [],
        studentCount: 0,
        semester: semester || null,
        subject: subject || '',
      });
      setSessionDocId(sessDoc.id);
    } catch (err) {
      console.error('Failed to record session:', err);
    }
  };

  const leaveSession = async () => {
    // Save code snapshots before leaving
    if (participantDocId && role === 'student') {
      try {
        const partRef = doc(db, 'sessionParticipants', participantDocId);
        const partSnap = await getDoc(partRef);
        if (partSnap.exists()) {
          const partData = partSnap.data();
          const currentSnapshots = partData.codeSnapshots || {};
          // Save current code for the active file/language
          const activeFileName = selectedLanguage === 'html' ? 'index.html' : 
            selectedLanguage === 'python' ? 'main.py' :
            selectedLanguage === 'java' ? 'Main.java' : `main.${selectedLanguage}`;
          const langKey = `${selectedLanguage}:${activeFileName}`;
          const updatedSnapshots = {
            ...currentSnapshots,
            [langKey]: {
              code: localCode,
              language: selectedLanguage,
              fileName: activeFileName,
              updatedAt: serverTimestamp(),
            }
          };
          await updateDoc(partRef, { codeSnapshots: updatedSnapshots });
        }
      } catch (err) {
        console.error('Failed to save code snapshots:', err);
      }
    }

    if (participantDocId) {
      try {
        await updateDoc(doc(db, 'sessionParticipants', participantDocId), {
          leftAt: serverTimestamp(),
          status: 'completed',
          languages: [selectedLanguage],
        });
      } catch (err) {
        console.error('Failed to update participation:', err);
      }
    }
    if (sessionDocId) {
      try {
        await updateDoc(doc(db, 'sessions', sessionDocId), {
          endedAt: serverTimestamp(),
          studentCount: connectedStudents.length,
        });
      } catch (err) {
        console.error('Failed to update session:', err);
      }
    }
    setInSession(false);
    setLobbyCode('');
    setIsHandRaised(false);
    setSessionDocId(null);
    setParticipantDocId(null);
  };

  React.useEffect(() => {
    if (socketError && inSession) {
      leaveSession();
    }
  }, [socketError]);

  // Periodically save code snapshots to Firestore
  React.useEffect(() => {
    if (!inSession || role !== 'student' || !participantDocId) return;
    const interval = setInterval(async () => {
      try {
        const partRef = doc(db, 'sessionParticipants', participantDocId);
        const partSnap = await getDoc(partRef);
        if (!partSnap.exists()) return;
        
        const partData = partSnap.data();
        const currentSnapshots = partData.codeSnapshots || {};
        
        // Get the current file name based on language
        const activeFileName = selectedLanguage === 'html' ? 'index.html' : 
          selectedLanguage === 'python' ? 'main.py' :
          selectedLanguage === 'java' ? 'Main.java' : `main.${selectedLanguage}`;
        const langKey = `${selectedLanguage}:${activeFileName}`;
        
        const updatedSnapshots = {
          ...currentSnapshots,
          [langKey]: {
            code: localCode,
            language: selectedLanguage,
            fileName: activeFileName,
            updatedAt: serverTimestamp(),
          }
        };
        
        await updateDoc(partRef, { codeSnapshots: updatedSnapshots });
      } catch (err) {
        console.error('Failed to save code snapshot:', err);
      }
    }, 10000); // Save every 10 seconds
    
    return () => clearInterval(interval);
  }, [inSession, role, participantDocId, localCode, selectedLanguage]);

  const handleRaiseHand = () => { raiseHand(); setIsHandRaised(true); };
  const handleLowerHand = () => { lowerHand(); setIsHandRaised(false); };

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-neutral-950 text-neutral-500 font-mono text-xs">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen isDark={isDark} setIsDark={setIsDark} />;
  }

  if (!inSession) {
    if (role === 'admin') {
      return <AdminDashboard isDark={isDark} onSignOut={signOut} />;
    }
    if (role === 'professor') {
      return <ProfessorLobby isDark={isDark} onCreateSession={handleCreateSession} onSignOut={signOut} />;
    }
    return <StudentDashboard isDark={isDark} onJoinSession={handleJoinSession} onSignOut={signOut} joinError={joinError} setJoinError={setJoinError} />;
  }

  const themeClass = isDark ? 'bg-neutral-950 text-neutral-200' : 'bg-neutral-50 text-neutral-900';
  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const headerClass = isDark ? 'bg-neutral-900' : 'bg-white shadow-sm';

  return (
    <div className={`w-screen h-screen flex flex-col font-mono overflow-hidden transition-colors duration-300 ${themeClass}`}>
      <header className={`border-b px-4 py-2 flex items-center justify-between ${headerClass} ${borderClass}`}>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="font-bold uppercase tracking-wider">CollabLab Terminal</span>
          <span className="text-neutral-400">
            LOBBY: <span className="font-bold">{lobbyCode}</span>
          </span>
        </div>
        <div className="flex items-center gap-6 text-[10px]">
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-2 hover:opacity-70 transition"
          >
            {isDark ? <Sun size={12} /> : <Moon size={12} />}
            <span className="hidden sm:inline uppercase">{isDark ? 'Light' : 'Dark'} Mode</span>
          </button>
          <span className="uppercase text-neutral-500">
            USER:{' '}
            <span className="text-emerald-500 font-bold">
              {role === 'professor' ? 'PROFESSOR' : (userProfile?.rollNumber || studentId)}
            </span>
          </span>
          <button
            onClick={leaveSession}
            className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-500 text-white px-2.5 py-1 rounded transition font-bold uppercase"
          >
            <LogOut size={10} /> Leave
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {role === 'student' ? (
          <StudentWorkspace
            isDark={isDark}
            lobbyCode={lobbyCode}
            studentId={studentId}
            localCode={localCode}
            setLocalCode={setLocalCode}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            terminalOutput={terminalOutput}
            setTerminalOutput={setTerminalOutput}
            isRunning={isRunning}
            onSyncCode={syncCode}
            onExecuteCode={executeCode}
            onRaiseHand={handleRaiseHand}
            onLowerHand={handleLowerHand}
            isHandRaised={isHandRaised}
            announcements={announcements}
            onDismissAnnouncement={dismissAnnouncement}
            onReportPaste={reportPaste}
          />
        ) : (
          <ProfessorDashboard
            isDark={isDark}
            lobbyCode={lobbyCode}
            connectedStudents={connectedStudents}
            studentStreams={studentStreams}
            studentOutputs={studentOutputs}
            handRaises={handRaises}
            onAcknowledgeHand={acknowledgeHand}
            onSendAnnouncement={sendAnnouncement}
            pasteAlerts={pasteAlerts}
            onDismissPasteAlert={dismissPasteAlert}
            studentLanguages={studentLanguages}
            studentActiveFiles={studentActiveFiles}
            studentFileList={studentFileList}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;