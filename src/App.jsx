import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import StudentWorkspace from './components/StudentWorkspace';
import ProfessorDashboard from './components/ProfessorDashboard';
import { useCollabSocket } from './hooks/useCollabSocket';

function App() {
  // Theme
  const [isDark, setIsDark] = useState(true);

  // Session
  const [isJoined, setIsJoined] = useState(false);
  const [lobbyCode, setLobbyCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState('student');

  // Editor state (student only)
  const [localCode, setLocalCode] = useState('print("System Online.")\n');
  const [selectedLanguage, setSelectedLanguage] = useState('python');

  // Hand-raise local tracking (student)
  const [isHandRaised, setIsHandRaised] = useState(false);

  // WebSocket hook
  const {
    connectedStudents,
    studentStreams,
    studentOutputs,
    terminalOutput,
    isRunning,
    error: socketError,
    handRaises,
    syncCode,
    executeCode,
    raiseHand,
    lowerHand,
    acknowledgeHand,
  } = useCollabSocket({ isJoined, role, lobbyCode, studentId });

  // Handle join from login screen
  const handleJoin = ({ lobbyCode: code, studentId: id, role: r }) => {
    setLobbyCode(code);
    setStudentId(id);
    setRole(r);
    setIsJoined(true);
  };

  // Handle socket errors — kick back to login
  React.useEffect(() => {
    if (socketError) {
      setIsJoined(false);
    }
  }, [socketError]);

  // Theme utilities
  const themeClass = isDark ? 'bg-neutral-950 text-neutral-200' : 'bg-neutral-50 text-neutral-900';
  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const headerClass = isDark ? 'bg-neutral-900' : 'bg-white shadow-sm';

  // Hand-raise wrappers for student
  const handleRaiseHand = () => {
    raiseHand();
    setIsHandRaised(true);
  };
  const handleLowerHand = () => {
    lowerHand();
    setIsHandRaised(false);
  };

  // --- LOGIN SCREEN ---
  if (!isJoined) {
    return (
      <LoginScreen
        onJoin={handleJoin}
        isDark={isDark}
        setIsDark={setIsDark}
        errorMessage={socketError}
      />
    );
  }

  // --- MAIN APP ---
  return (
    <div className={`w-screen h-screen flex flex-col font-mono overflow-hidden transition-colors duration-300 ${themeClass}`}>
      {/* Header */}
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
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={12} /> : <Moon size={12} />}
            <span className="hidden sm:inline uppercase">{isDark ? 'Light' : 'Dark'} Mode</span>
          </button>
          <span className="uppercase text-neutral-500">
            USER:{' '}
            <span className="text-emerald-500 font-bold">
              {role === 'professor' ? 'PROFESSOR' : studentId}
            </span>
          </span>
        </div>
      </header>

      {/* Main Content */}
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
            isRunning={isRunning}
            onSyncCode={syncCode}
            onExecuteCode={executeCode}
            onRaiseHand={handleRaiseHand}
            onLowerHand={handleLowerHand}
            isHandRaised={isHandRaised}
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
          />
        )}
      </main>
    </div>
  );
}

export default App;