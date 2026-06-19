import React from 'react';

export default function MonitorGrid({ isDark, studentStreams, studentOutputs, handRaises, onAcknowledgeHand }) {
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

  return (
    <div className="p-4 flex flex-col h-full overflow-hidden">
      <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3">
        Monitoring Grid
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto pr-1">
        {streamIds.map(studentId => (
          <div
            key={studentId}
            className={`rounded flex flex-col h-72 border overflow-hidden ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            } ${handRaises.has(studentId) ? 'ring-2 ring-amber-500' : ''}`}
          >
            <div className={`text-[10px] font-bold px-3 py-1.5 border-b flex items-center justify-between ${
              isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-800' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
            }`}>
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

            <pre className={`flex-1 p-2 text-[10px] overflow-hidden whitespace-pre-wrap ${
              isDark ? 'bg-black text-neutral-500' : 'bg-white text-neutral-400'
            }`}>
              {studentStreams[studentId]}
            </pre>

            <div className={`h-1/3 p-2 overflow-y-auto border-t ${
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
