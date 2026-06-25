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
  Timestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

function AppContent() {
  const { user, userProfile, loading, signOut } = useAuth();
  const [isDark, setIsDark] = useState(true);

  const [inSession, setInSession] = useState(false);
  const [lobbyCode, setLobbyCode] = useState('');
  const [sessionDocId, setSessionDocId] = useState(null);
  const [participantDocId, setParticipantDocId] = useState(null);

  const [localCode, setLocalCode] = useState('print("System Online.")\\n');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [isHandRaised, setIsHandRaised] = useState(false);

  const role = userProfile?.role || 'student';
  const studentId = role === 'student'
    ? (userProfile?.rollNumber || userProfile?.displayName || user?.email || '')
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
    setLobbyCode(code);
    setInSession(true);

    if (role === 'student') {
      try {
        // Find the active session by lobbyCode to get sessionId, semester, subject
        let activeSessionId = '';
        let sessionSemester = null;
        let sessionSubject = '';
        let sessionProfessorName = '';
        try {
          const sessQ = query(
            collection(db, 'sessions'),
            where('lobbyCode', '==', code),
            limit(1)
          );
          const sessSnap = await getDocs(sessQ);
          if (!sessSnap.empty) {
            const sessData = sessSnap.docs[0];
            activeSessionId = sessData.id;
            sessionSemester = sessData.data().semester || null;
            sessionSubject = sessData.data().subject || '';
            sessionProfessorName = sessData.data().professorName || '';
          }
        } catch (err) {
          console.warn('Could not look up active session:', err);
        }

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
        });
        setParticipantDocId(partDoc.id);
      } catch (err) {
        console.error('Failed to record session participation:', err);
      }
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
    return <StudentDashboard isDark={isDark} onJoinSession={handleJoinSession} onSignOut={signOut} />;
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