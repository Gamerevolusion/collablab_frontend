import React, { useState, useEffect } from 'react';
import { LogOut, Clock, Users, ArrowRight, Calendar, Plus } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function ProfessorLobby({ isDark, onCreateSession, onSignOut }) {
  const { user, userProfile } = useAuth();
  const [lobbyCode, setLobbyCode] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const cardClass = isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm';

  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      try {
        const q = query(
          collection(db, 'sessions'),
          where('professorUid', '==', user.uid),
          orderBy('startedAt', 'desc')
        );
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [user]);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setLobbyCode(code);
  };

  const handleStart = () => {
    if (lobbyCode.trim()) onCreateSession(lobbyCode.trim());
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return '—';
    const ms = (end.toDate ? end.toDate() : new Date(end)) - (start.toDate ? start.toDate() : new Date(start));
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return '< 1 min';
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className={`w-screen h-screen flex flex-col font-mono overflow-hidden transition-colors duration-300 ${isDark ? 'bg-neutral-950 text-neutral-200' : 'bg-neutral-50 text-neutral-900'}`}>
      <header className={`border-b px-6 py-3 flex items-center justify-between ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-wider">CollabLab</span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>Professor</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-neutral-500">{userProfile?.displayName || user?.email}</span>
          <button onClick={onSignOut} className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-500 text-white px-2.5 py-1 rounded transition font-bold uppercase">
            <LogOut size={10} /> Sign Out
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-start gap-6">
            <div className={`flex-1 border rounded-xl p-5 ${cardClass}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                  {(userProfile?.displayName || 'P')[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold">{userProfile?.displayName || 'Professor'}</div>
                  <div className="text-[10px] text-neutral-500">{user?.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-3 border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                  <div className="text-[9px] text-neutral-500 uppercase font-bold flex items-center gap-1"><Clock size={8} /> Sessions Hosted</div>
                  <div className="text-xs font-bold mt-1">{sessions.length}</div>
                </div>
                <div className={`rounded-lg p-3 border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                  <div className="text-[9px] text-neutral-500 uppercase font-bold flex items-center gap-1"><Users size={8} /> Total Students</div>
                  <div className="text-xs font-bold mt-1">{sessions.reduce((sum, s) => sum + (s.studentCount || 0), 0)}</div>
                </div>
              </div>
            </div>

            <div className={`w-80 border rounded-xl p-5 ${cardClass}`}>
              <div className="text-[10px] font-bold uppercase text-neutral-500 mb-3">Start a Session</div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={lobbyCode}
                  onChange={e => setLobbyCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                  placeholder="Lobby code..."
                  className={`flex-1 border rounded px-3 py-2 text-xs focus:outline-none transition ${isDark ? 'bg-black border-neutral-800 placeholder:text-neutral-700' : 'bg-white border-neutral-300 text-black placeholder:text-neutral-400'}`}
                />
                <button
                  onClick={generateCode}
                  className={`px-2.5 py-2 rounded border text-[9px] font-bold uppercase transition ${isDark ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-400' : 'border-neutral-300 hover:bg-neutral-100 text-neutral-600'}`}
                  title="Generate random code"
                >
                  <Plus size={12} />
                </button>
              </div>
              <button
                onClick={handleStart}
                disabled={!lobbyCode.trim()}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white px-4 py-2 rounded text-xs font-bold uppercase transition"
              >
                Create Session <ArrowRight size={12} />
              </button>
            </div>
          </div>

          <div className={`border rounded-xl p-5 ${cardClass}`}>
            <div className="text-[10px] font-bold uppercase text-neutral-500 mb-4 flex items-center gap-1.5">
              <Calendar size={10} /> Past Sessions
            </div>
            {loadingSessions ? (
              <div className="text-[10px] text-neutral-500 text-center py-8">Loading session history...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-neutral-500 text-[10px]">No sessions hosted yet.</div>
                <div className="text-neutral-600 text-[9px] mt-1">Create a session to get started.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className={`border-b ${borderClass}`}>
                      <th className="text-left py-2 px-3 text-[9px] uppercase text-neutral-500 font-bold">Date</th>
                      <th className="text-left py-2 px-3 text-[9px] uppercase text-neutral-500 font-bold">Lobby Code</th>
                      <th className="text-left py-2 px-3 text-[9px] uppercase text-neutral-500 font-bold">Students</th>
                      <th className="text-left py-2 px-3 text-[9px] uppercase text-neutral-500 font-bold">Duration</th>
                      <th className="text-left py-2 px-3 text-[9px] uppercase text-neutral-500 font-bold">Languages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id} className={`border-b ${borderClass} hover:bg-neutral-800/30 transition`}>
                        <td className="py-2.5 px-3">
                          <div>{formatDate(s.startedAt)}</div>
                          <div className="text-[9px] text-neutral-500">{formatTime(s.startedAt)}</div>
                        </td>
                        <td className="py-2.5 px-3 font-bold">{s.lobbyCode}</td>
                        <td className="py-2.5 px-3">{s.studentCount || 0}</td>
                        <td className="py-2.5 px-3">{formatDuration(s.startedAt, s.endedAt)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex gap-1 flex-wrap">
                            {(s.languages || []).map(l => (
                              <span key={l} className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-600'}`}>{l}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
