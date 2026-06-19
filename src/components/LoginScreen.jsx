import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function LoginScreen({ onJoin, isDark, setIsDark, errorMessage }) {
  const [lobbyCode, setLobbyCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState('student');
  const [validationError, setValidationError] = useState('');

  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const cardClass = isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border-neutral-200';
  const themeClass = isDark ? 'bg-neutral-950 text-neutral-200' : 'bg-neutral-50 text-neutral-900';

  const handleSubmit = () => {
    setValidationError('');
    if (!lobbyCode.trim()) {
      setValidationError('Lobby code is required.');
      return;
    }
    if (role === 'student' && !studentId.trim()) {
      setValidationError('Name / Roll Number is required.');
      return;
    }
    onJoin({ lobbyCode: lobbyCode.trim(), studentId: studentId.trim(), role });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const displayError = validationError || errorMessage;

  return (
    <div className={`w-screen h-screen flex items-center justify-center font-mono ${themeClass}`}>
      <div className={`${cardClass} border p-6 rounded-md max-w-sm w-full transition-all duration-300`}>
        <div className={`mb-6 border-b pb-3 flex justify-between items-center ${borderClass}`}>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider">CollabLab Gateway</h1>
            <p className="text-[10px] text-neutral-500 mt-1">Collaborative Lab Portal</p>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-neutral-200/20 transition"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {displayError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] px-3 py-2 rounded mb-4 font-bold tracking-tight">
            ⚠ {displayError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase text-neutral-500 mb-1.5 font-bold">Role</label>
            <div className={`grid grid-cols-2 gap-1 p-1 rounded border ${isDark ? 'bg-black border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
              <button
                onClick={() => setRole('student')}
                className={`py-1.5 text-xs font-medium rounded transition ${role === 'student' ? (isDark ? 'bg-neutral-800 text-white' : 'bg-white text-black shadow-sm') : 'text-neutral-500'}`}
              >
                Student
              </button>
              <button
                onClick={() => setRole('professor')}
                className={`py-1.5 text-xs font-medium rounded transition ${role === 'professor' ? (isDark ? 'bg-neutral-800 text-white' : 'bg-white text-black shadow-sm') : 'text-neutral-500'}`}
              >
                Professor
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-neutral-500 mb-1 font-bold">Lobby Code</label>
            <input
              id="lobby-code-input"
              type="text"
              value={lobbyCode}
              onChange={e => setLobbyCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. CS101-LAB3"
              className={`w-full border rounded px-2.5 py-1.5 text-xs focus:outline-none transition ${isDark ? 'bg-black border-neutral-800 placeholder:text-neutral-700' : 'bg-white border-neutral-300 text-black placeholder:text-neutral-400'}`}
            />
          </div>

          {role === 'student' && (
            <div>
              <label className="block text-[10px] uppercase text-neutral-500 mb-1 font-bold">Name / Roll Number</label>
              <input
                id="student-id-input"
                type="text"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Rahul_2301"
                className={`w-full border rounded px-2.5 py-1.5 text-xs focus:outline-none transition ${isDark ? 'bg-black border-neutral-800 placeholder:text-neutral-700' : 'bg-white border-neutral-300 text-black placeholder:text-neutral-400'}`}
              />
            </div>
          )}

          <button
            id="authenticate-btn"
            onClick={handleSubmit}
            className={`w-full text-xs font-bold py-2 px-4 rounded transition uppercase tracking-wider ${isDark ? 'bg-neutral-200 text-black hover:bg-white' : 'bg-black text-white hover:bg-neutral-800'}`}
          >
            Authenticate
          </button>
        </div>
      </div>
    </div>
  );
}
