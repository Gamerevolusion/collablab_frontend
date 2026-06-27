import React, { useState } from 'react';
import { Megaphone, FileText } from 'lucide-react';
import Editor from '@monaco-editor/react';
import MonitorGrid from './MonitorGrid';

const EXT_TO_MONACO = {
  '.py': 'python',
  '.js': 'javascript',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.r': 'r',
  '.sql': 'sql',
};

const getMonacoLang = (fileName) => {
  const ext = '.' + (fileName || '').split('.').pop().toLowerCase();
  return EXT_TO_MONACO[ext] || 'plaintext';
};

export default function ProfessorDashboard({
  isDark,
  lobbyCode,
  connectedStudents,
  studentStreams,
  studentOutputs,
  handRaises,
  onAcknowledgeHand,
  onSendAnnouncement,
  pasteAlerts,
  onDismissPasteAlert,
  studentLanguages,
  studentActiveFiles,
  studentFileList,
}) {
  const [activeCollabStudent, setActiveCollabStudent] = useState(null);
  const [collabViewingFile, setCollabViewingFile] = useState(null);
  const [announcementText, setAnnouncementText] = useState('');
  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';

  // Get the code content for the active collab student's selected file
  const getCollabCode = () => {
    if (!activeCollabStudent) return '';
    const files = studentStreams[activeCollabStudent];
    if (!files || typeof files === 'string') return files || '';
    const fileName = collabViewingFile || studentActiveFiles[activeCollabStudent] || Object.keys(files)[0] || 'main';
    return files[fileName] || '';
  };

  const getCollabFileName = () => {
    if (!activeCollabStudent) return 'main';
    return collabViewingFile || studentActiveFiles[activeCollabStudent] || Object.keys(studentStreams[activeCollabStudent] || {})[0] || 'main';
  };

  const getCollabFileList = () => {
    if (!activeCollabStudent) return [];
    return studentFileList[activeCollabStudent] || Object.keys(studentStreams[activeCollabStudent] || {});
  };

  // Find the display name for the active student
  const getStudentDisplayName = (rollNumber) => {
    const student = connectedStudents.find(s => s.rollNumber === rollNumber);
    return student ? student.name : rollNumber;
  };

  return (
    <div className={`flex-1 grid grid-cols-5 h-full divide-x ${borderClass}`}>
      <div className={`col-span-1 p-4 flex flex-col ${isDark ? 'bg-neutral-950' : 'bg-neutral-50'}`}>
        <div className={`text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3 border-b pb-2 ${borderClass}`}>
          Active Roster ({connectedStudents.length})
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {connectedStudents.map(student => (
            <div
              key={student.rollNumber}
              className={`p-2 rounded flex flex-col gap-2 border transition ${
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
              } ${handRaises.has(student.rollNumber) ? 'ring-2 ring-amber-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold truncate" title={student.name}>{student.name}</div>
                    <div className={`text-[8px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{student.rollNumber}</div>
                  </div>
                </div>
                {handRaises.has(student.rollNumber) && (
                  <button
                    onClick={() => onAcknowledgeHand(student.rollNumber)}
                    className="text-amber-500 hover:text-amber-400 transition animate-pulse"
                    title="Acknowledge hand raise"
                  >
                    ✋
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  if (activeCollabStudent === student.rollNumber) {
                    setActiveCollabStudent(null);
                    setCollabViewingFile(null);
                  } else {
                    setActiveCollabStudent(student.rollNumber);
                    setCollabViewingFile(null);
                  }
                }}
                className={`text-[9px] px-2 py-0.5 rounded border transition ${
                  activeCollabStudent === student.rollNumber
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : isDark ? 'hover:bg-neutral-800 border-neutral-700 text-neutral-400' : 'hover:bg-neutral-100 border-neutral-300 text-neutral-600'
                }`}
              >
                {activeCollabStudent === student.rollNumber ? 'Close' : 'View Code'}
              </button>
            </div>
          ))}
          {connectedStudents.length === 0 && (
            <p className="text-[10px] text-neutral-600 text-center mt-8">
              No students connected yet.
            </p>
          )}
        </div>

        <div className={`border-t pt-3 ${borderClass}`}>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Megaphone size={10} /> Announce
          </div>
          <textarea
            id="announcement-input"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="Type an announcement..."
            rows={2}
            className={`w-full border rounded px-2 py-1.5 text-[10px] resize-none focus:outline-none transition ${isDark ? 'bg-black border-neutral-800 placeholder:text-neutral-700' : 'bg-white border-neutral-300 text-black placeholder:text-neutral-400'}`}
          />
          <button
            id="send-announcement-btn"
            onClick={() => {
              if (announcementText.trim()) {
                onSendAnnouncement(announcementText.trim());
                setAnnouncementText('');
              }
            }}
            className={`w-full mt-1.5 text-[9px] font-bold py-1.5 rounded uppercase tracking-wider transition ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-500 hover:bg-indigo-400 text-white'}`}
          >
            Broadcast to All Students
          </button>
        </div>
      </div>

      <div className={`col-span-4 flex flex-col h-full overflow-hidden ${isDark ? 'bg-neutral-900/30' : 'bg-neutral-100'}`}>
        {activeCollabStudent ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Header bar */}
            <div className={`px-4 py-2 text-[10px] font-bold uppercase flex justify-between items-center ${
              isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-100 text-amber-700'
            }`}>
              <span>Viewing: {getStudentDisplayName(activeCollabStudent)} ({activeCollabStudent})</span>
              <button
                onClick={() => { setActiveCollabStudent(null); setCollabViewingFile(null); }}
                className="hover:opacity-60 transition"
              >
                ✕
              </button>
            </div>

            {/* File tabs */}
            {getCollabFileList().length > 0 && (
              <div className={`flex items-center gap-0.5 px-3 py-1.5 border-b overflow-x-auto ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                {getCollabFileList().map(f => {
                  const isActive = getCollabFileName() === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setCollabViewingFile(f)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition whitespace-nowrap ${
                        isActive
                          ? (isDark ? 'bg-neutral-700 text-white' : 'bg-white text-black shadow-sm')
                          : (isDark ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100')
                      }`}
                    >
                      <FileText size={9} /> {f}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Read-only code editor showing the student's live stream */}
            <div className="flex-1">
              <Editor
                key={`${activeCollabStudent}-${getCollabFileName()}`}
                height="100%"
                width="100%"
                theme={isDark ? 'vs-dark' : 'light'}
                language={getMonacoLang(getCollabFileName())}
                value={getCollabCode()}
                options={{ fontSize: 13, minimap: { enabled: false }, readOnly: true, domReadOnly: true }}
              />
            </div>

            {/* Student output */}
            <div className={`h-[20%] p-3 overflow-y-auto border-t ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
              <div className="text-[9px] text-neutral-500 font-bold uppercase mb-1">Output</div>
              <pre className="text-[10px] text-emerald-500 font-bold whitespace-pre-wrap leading-tight">
                {studentOutputs[activeCollabStudent] || 'NO EXECUTION DATA'}
              </pre>
            </div>
          </div>
        ) : (
          <MonitorGrid
            isDark={isDark}
            studentStreams={studentStreams}
            studentOutputs={studentOutputs}
            handRaises={handRaises}
            onAcknowledgeHand={onAcknowledgeHand}
            pasteAlerts={pasteAlerts}
            onDismissPasteAlert={onDismissPasteAlert}
            studentLanguages={studentLanguages}
            studentActiveFiles={studentActiveFiles}
            studentFileList={studentFileList}
          />
        )}
      </div>
    </div>
  );
}
