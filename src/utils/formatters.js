/**
 * Format a Firestore timestamp to a human-readable date string.
 * @param {import('firebase/firestore').Timestamp | Date | null} ts
 * @returns {string}
 */
export function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format a Firestore timestamp to a time string (HH:MM).
 * @param {import('firebase/firestore').Timestamp | Date | null} ts
 * @returns {string}
 */
export function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format the duration between two Firestore timestamps.
 * @param {import('firebase/firestore').Timestamp | Date | null} start
 * @param {import('firebase/firestore').Timestamp | Date | null} end
 * @returns {string}
 */
export function formatDuration(start, end) {
  if (!start || !end) return '—';
  const ms = (end.toDate ? end.toDate() : new Date(end)) - (start.toDate ? start.toDate() : new Date(start));
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
