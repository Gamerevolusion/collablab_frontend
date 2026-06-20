import React, { useState } from 'react';
import { Maximize2, Grid, Clipboard } from 'lucide-react';

export default function MonitorGrid({ isDark, studentStreams, studentOutputs, handRaises, onAcknowledgeHand, pasteAlerts, onDismissPasteAlert }) {
  const [focusedStudent, setFocusedStudent] = useState(null);
  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const streamIds = Object.keys(studentStreams);

  if (streamIds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
            Monitoring Grid
          </div>
          <p className={`text-[11px] ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
            Student code will appear here once they start typing.
          </p>
        </div>
      </div>
    );
  }

  const displayIds = focusedStudent ? [focusedStudent] : streamIds;

  return (
    <div className="p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
          {focusedStudent ? `Focused: ${focusedStudent}` : 'Monitoring Grid'}
        </div>
        {focusedStudent && (
          <button
            id="back-to-grid-btn"
            onClick={() => setFocusedStudent(null)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-bold uppercase transition ${isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'}`}
          >
            <Grid size={9} /> View All Students
          </button>
        )}
      </div>
      <div className={`flex-1 ${focusedStudent ? 'flex flex-col' : 'grid grid-cols-2 gap-3'} overflow-y-auto pr-1`}>
        {displayIds.map(studentId => (
          <div
            key={studentId}
            className={`rounded flex flex-col border overflow-hidden ${focusedStudent ? 'flex-1' : 'h-72'} ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            } ${handRaises.has(studentId) ? 'ring-2 ring-amber-500' : ''}`}
          >
            <div className={`text-[10px] font-bold px-3 py-1.5 border-b flex items-center justify-between ${
              isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-800' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
            }`}>
              <div className="flex items-center gap-2">
                <span>ID: {studentId}</span>
                {handRaises.has(studentId) && (
                  <button
                    onClick={() => onAcknowledgeHand(studentId)}
                    className="flex items-center gap-1 text-amber-500 hover:text-amber-400 transition animate-pulse"
                    title="Click to acknowledge"
                  >
                    ✋ Needs Help
                  </button>
                )}
              </div>
              <button
                onClick={() => setFocusedStudent(focusedStudent === studentId ? null : studentId)}
                className={`p-1 rounded transition ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-200'}`}
                title={focusedStudent ? 'Back to grid' : 'Focus on this student'}
              >
                {focusedStudent ? <Grid size={10} /> : <Maximize2 size={10} />}
              </button>
            </div>

            {pasteAlerts && pasteAlerts[studentId] && (
              <div className="flex items-center justify-between px-3 py-1 bg-red-500/15 text-red-400 text-[9px] font-bold uppercase">
                <div className="flex items-center gap-1.5">
                  <Clipboard size={9} /> Copy-Paste Detected — {pasteAlerts[studentId].charCount} chars pasted
                </div>
                <button
                  onClick={() => onDismissPasteAlert(studentId)}
                  className="hover:text-red-300 transition text-[10px]"
                  title="Dismiss alert"
                >
                  ✕
                </button>
              </div>
            )}

            <pre className={`flex-1 p-2 text-[10px] overflow-auto whitespace-pre-wrap ${
              isDark ? 'bg-black text-neutral-500' : 'bg-white text-neutral-400'
            }`}>
              {studentStreams[studentId]}
            </pre>

            <div className={`${focusedStudent ? 'h-1/4' : 'h-1/3'} p-2 overflow-y-auto border-t ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <pre className="text-[10px] text-emerald-500 font-bold whitespace-pre-wrap leading-tight">
                {studentOutputs[studentId] || 'NO EXECUTION DATA'}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
