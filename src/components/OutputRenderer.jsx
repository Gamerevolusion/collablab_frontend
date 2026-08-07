import React from 'react';

/**
 * Renders terminal output, parsing embedded base64 matplotlib plots.
 * Used by both StudentWorkspace and MonitorGrid/ProfessorDashboard.
 *
 * @param {{ output: string, isDark?: boolean, maxPlotHeight?: string }} props
 */
export default function OutputRenderer({ output, isDark = true, maxPlotHeight = '400px' }) {
  if (!output) {
    return <span className="text-neutral-600">No output yet.</span>;
  }

  // Split output into text and base64 plot segments
  const parts = output.split(/(__PLOT_BASE64__.*?__PLOT_END__)/s);

  return parts.map((part, i) => {
    if (part.startsWith('__PLOT_BASE64__') && part.endsWith('__PLOT_END__')) {
      const b64 = part.slice('__PLOT_BASE64__'.length, -'__PLOT_END__'.length);
      return (
        <div key={i} className="my-3 rounded-lg overflow-hidden border border-neutral-800 inline-block">
          <img
            src={`data:image/png;base64,${b64}`}
            alt={`Plot ${Math.floor(i / 2) + 1}`}
            className="max-w-full h-auto"
            style={{ maxHeight: maxPlotHeight }}
          />
        </div>
      );
    }
    return part ? <span key={i}>{part}</span> : null;
  });
}
