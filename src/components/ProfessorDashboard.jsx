import React, { useState } from 'react';
import { Megaphone } from 'lucide-react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import MonitorGrid from './MonitorGrid';

// Central CRDT signaling server URL
const CRDT_URL = 'wss://collablab-sync-engine.onrender.com';

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
}) {
  const [activeCollabStudent, setActiveCollabStudent] = useState(null);
  const [announcementText, setAnnouncementText] = useState('');
  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';

  const handleEditorMount = (editor, monaco, targetStudentId) => {
    const ydoc = new Y.Doc();
    const roomName = `collablab-${lobbyCode}-${targetStudentId}`;
    const provider = new WebsocketProvider(CRDT_URL, roomName, ydoc);
    const ytext = ydoc.getText('monaco');
    new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness);
    provider.awareness.setLocalStateField('user', {
      name: 'Professor',
      color: '#f59e0b',
    });
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
              key={student}
              className={`p-2 rounded flex flex-col gap-2 border transition ${
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
              } ${handRaises.has(student) ? 'ring-2 ring-amber-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span title={student} className="truncate max-w-[100px]">{student}</span>
                </div>
                {handRaises.has(student) && (
                  <button
                    onClick={() => onAcknowledgeHand(student)}
                    className="text-amber-500 hover:text-amber-400 transition animate-pulse"
                    title="Acknowledge hand raise"
                  >
                    ✋
                  </button>
                )}
              </div>
              <button
                onClick={() => setActiveCollabStudent(activeCollabStudent === student ? null : student)}
                className={`text-[9px] uppercase font-bold py-1 rounded transition ${
                  activeCollabStudent === student
                    ? 'bg-amber-600 text-white'
                    : isDark
                      ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                }`}
              >
                {activeCollabStudent === student ? 'Close Frame' : 'Collaborate'}
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
            <div className={`px-4 py-2 text-[10px] font-bold uppercase flex justify-between items-center ${
              isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-100 text-amber-700'
            }`}>
              <span>Active Session: ID {activeCollabStudent}</span>
              <button
                onClick={() => setActiveCollabStudent(null)}
                className="hover:opacity-60 transition"
              >
                ✕
              </button>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                width="100%"
                theme={isDark ? 'vs-dark' : 'light'}
                language="python"
                onMount={(editor, monaco) => handleEditorMount(editor, monaco, activeCollabStudent)}
                options={{ fontSize: 13, minimap: { enabled: false } }}
              />
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
          />
        )}
      </div>
    </div>
  );
}
