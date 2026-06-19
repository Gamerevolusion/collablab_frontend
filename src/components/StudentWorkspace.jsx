import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Hand } from 'lucide-react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

const CRDT_URL = 'wss://collablab-sync-engine.onrender.com';

/**
 * Student workspace: Monaco editor with CRDT sync + terminal output + hand-raise.
 */
export default function StudentWorkspace({
  isDark,
  lobbyCode,
  studentId,
  localCode,
  setLocalCode,
  selectedLanguage,
  setSelectedLanguage,
  terminalOutput,
  isRunning,
  onSyncCode,
  onExecuteCode,
  onRaiseHand,
  onLowerHand,
  isHandRaised,
}) {
  const editorRef = useRef(null);
  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const headerClass = isDark ? 'bg-neutral-900' : 'bg-white shadow-sm';

  const handleEditorChange = (value) => {
    setLocalCode(value || '');
    onSyncCode(value || '');
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    const ydoc = new Y.Doc();
    const roomName = `collablab-${lobbyCode}-${studentId}`;
    const provider = new WebsocketProvider(CRDT_URL, roomName, ydoc);
    const ytext = ydoc.getText('monaco');
    new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness);
    provider.awareness.setLocalStateField('user', {
      name: studentId,
      color: '#10b981',
    });
  };

  const handleRun = () => {
    const codeToRun = editorRef.current ? editorRef.current.getValue() : localCode;
    onExecuteCode(selectedLanguage, codeToRun);
  };

  const toggleHand = () => {
    if (isHandRaised) {
      onLowerHand();
    } else {
      onRaiseHand();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Toolbar */}
      <div className={`flex items-center justify-between border-b px-4 py-2 ${headerClass} ${borderClass}`}>
        <div className="flex items-center gap-3">
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className={`border rounded text-[10px] px-2 py-1 focus:outline-none ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 text-black'}`}
          >
            <option value="python">Python 3</option>
            <option value="javascript">Node.js</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="hand-raise-btn"
            onClick={toggleHand}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold transition ${
              isHandRaised
                ? 'bg-amber-500 text-white hover:bg-amber-400 animate-pulse'
                : isDark
                  ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
            }`}
            title={isHandRaised ? 'Lower your hand' : 'Raise your hand for help'}
          >
            <Hand size={10} /> {isHandRaised ? 'HAND RAISED' : 'RAISE HAND'}
          </button>
          <button
            id="run-code-btn"
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-[10px] font-bold transition disabled:opacity-50"
          >
            <Play size={10} /> {isRunning ? 'RUNNING...' : 'RUN CODE'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className={`h-[65%] w-full border-b ${borderClass}`}>
        <Editor
          height="100%"
          width="100%"
          theme={isDark ? 'vs-dark' : 'light'}
          language={selectedLanguage}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{ fontSize: 13, minimap: { enabled: false } }}
        />
      </div>

      {/* Terminal */}
      <div className={`h-[35%] w-full p-4 overflow-y-auto ${isDark ? 'bg-black' : 'bg-neutral-100'}`}>
        <div className="text-[9px] text-neutral-500 font-bold uppercase mb-2">Live Console</div>
        <pre className={`text-xs whitespace-pre-wrap ${isDark ? 'text-neutral-300' : 'text-neutral-700 font-semibold'}`}>
          {terminalOutput}
        </pre>
      </div>
    </div>
  );
}
