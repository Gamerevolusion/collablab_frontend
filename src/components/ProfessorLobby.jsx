import React, { useState, useEffect } from 'react';
import { LogOut, Clock, Users, ArrowRight, Calendar, Plus, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const SEMESTERS = [1, 2, 3, 4, 5, 6];

export default function ProfessorLobby({ isDark, onCreateSession, onSignOut }) {
  const { user, userProfile } = useAuth();
  const [lobbyCode, setLobbyCode] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSem, setSelectedSem] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const cardClass = isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm';
  const inputClass = isDark
    ? 'bg-black border-neutral-800 placeholder:text-neutral-700 text-neutral-200'
    : 'bg-white border-neutral-300 text-black placeholder:text-neutral-400';

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

  useEffect(() => {
    if (!selectedSem) { setSubjects([]); setSelectedSubject(''); return; }
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      setSelectedSubject('');
      try {
        const q = query(
          collection(db, 'subjects'),
          where('semester', '==', selectedSem),
          orderBy('name', 'asc')
        );
        const snap = await getDocs(q);
        setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to load subjects:', err);
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [selectedSem]);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setLobbyCode(code);
  };

  const handleStart = () => {
    if (lobbyCode.trim() && selectedSem && selectedSubject) {
      onCreateSession(lobbyCode.trim(), selectedSem, selectedSubject);
    }
  };

  const canCreate = lobbyCode.trim() && selectedSem && selectedSubject;

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

            <div className={`w-96 border rounded-xl p-5 ${cardClass}`}>
              <div className="text-[10px] font-bold uppercase text-neutral-500 mb-3">Start a Session</div>

              <div className="mb-3">
                <div className="text-[9px] font-bold uppercase text-neutral-500 mb-1.5">Semester</div>
                <div className="flex gap-1.5">
                  {SEMESTERS.map(sem => (
                    <button
                      key={sem}
                      onClick={() => setSelectedSem(sem)}
                      className={`w-8 h-8 rounded text-[10px] font-bold transition ${
                        selectedSem === sem
                          ? 'bg-amber-600 text-white'
                          : isDark ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSem && (
                <div className="mb-3">
                  <div className="text-[9px] font-bold uppercase text-neutral-500 mb-1.5 flex items-center gap-1">
                    <BookOpen size={8} /> Subject (Sem {selectedSem})
                  </div>
                  {loadingSubjects ? (
                    <div className="text-[9px] text-neutral-600 py-1">Loading subjects...</div>
                  ) : subjects.length === 0 ? (
                    <div className={`text-[9px] px-2.5 py-2 rounded border ${isDark ? 'text-neutral-600 border-neutral-800 bg-neutral-950' : 'text-neutral-400 border-neutral-200 bg-neutral-50'}`}>
                      No subjects found. Ask the admin to add subjects for Sem {selectedSem}.
                    </div>
                  ) : (
                    <select
                      value={selectedSubject}
                      onChange={e => setSelectedSubject(e.target.value)}
                      className={`w-full border rounded px-2.5 py-2 text-xs focus:outline-none transition ${inputClass}`}
                    >
                      <option value="">Select a subject...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={lobbyCode}
                  onChange={e => setLobbyCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && canCreate && handleStart()}
                  placeholder="Lobby code..."
                  className={`flex-1 border rounded px-3 py-2 text-xs focus:outline-none transition ${inputClass}`}
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
                disabled={!canCreate}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white px-4 py-2 rounded text-xs font-bold uppercase transition"
              >
                Create Session <ArrowRight size={12} />
              </button>
              {!canCreate && lobbyCode.trim() && (
                <div className="text-[8px] text-amber-500 mt-1.5 text-center">
                  {!selectedSem ? 'Select a semester' : !selectedSubject ? 'Select a subject' : ''}
                </div>
              )}
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
                      <th className="text-left py-2 px-3 text-[9px] uppercase text-neutral-500 font-bold">Lobby</th>
                      <th className="text-left py-2 px-3 text-[9px] uppercase text-neutral-500 font-bold">Subject</th>
                      <th className="text-left py-2 px-3 text-[9px] uppercase text-neutral-500 font-bold">Sem</th>
                      <th className="text-left py-2 px-3 text-[9px] uppercase text-neutral-500 font-bold">Students</th>
                      <th className="text-left py-2 px-3 text-[9px] uppercase text-neutral-500 font-bold">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <React.Fragment key={s.id}>
                        <tr
                          className={`border-b ${borderClass} hover:bg-neutral-800/30 transition cursor-pointer`}
                          onClick={async () => {
                            if (expandedSession === s.id) {
                              setExpandedSession(null);
                              setAttendanceData([]);
                              return;
                            }
                            setExpandedSession(s.id);
                            setLoadingAttendance(true);
                            try {
                              const q = query(
                                collection(db, 'sessionParticipants'),
                                where('sessionId', '==', s.id)
                              );
                              const snap = await getDocs(q);
                              setAttendanceData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                            } catch (err) {
                              console.error('Failed to load attendance:', err);
                              setAttendanceData([]);
                            } finally {
                              setLoadingAttendance(false);
                            }
                          }}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              {expandedSession === s.id ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                              <div>
                                <div>{formatDate(s.startedAt)}</div>
                                <div className="text-[9px] text-neutral-500">{formatTime(s.startedAt)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-bold">{s.lobbyCode}</td>
                          <td className="py-2.5 px-3">{s.subject || '—'}</td>
                          <td className="py-2.5 px-3">{s.semester || '—'}</td>
                          <td className="py-2.5 px-3">{s.studentCount || 0}</td>
                          <td className="py-2.5 px-3">{formatDuration(s.startedAt, s.endedAt)}</td>
                        </tr>
                        {expandedSession === s.id && (
                          <tr>
                            <td colSpan="6" className={`p-0 ${isDark ? 'bg-neutral-950' : 'bg-neutral-50'}`}>
                              <div className="px-6 py-3">
                                <div className="text-[9px] font-bold uppercase text-neutral-500 mb-2 flex items-center gap-1">
                                  <Users size={9} /> Attendance — {attendanceData.length} student{attendanceData.length !== 1 ? 's' : ''}
                                </div>
                                {loadingAttendance ? (
                                  <div className="text-[9px] text-neutral-600 py-2">Loading attendance...</div>
                                ) : attendanceData.length === 0 ? (
                                  <div className="text-[9px] text-neutral-600 py-2">No students recorded for this session.</div>
                                ) : (
                                  <table className="w-full text-[10px]">
                                    <thead>
                                      <tr className={`border-b ${borderClass}`}>
                                        <th className="text-left py-1.5 px-2 text-[8px] uppercase text-neutral-500 font-bold">#</th>
                                        <th className="text-left py-1.5 px-2 text-[8px] uppercase text-neutral-500 font-bold">Name</th>
                                        <th className="text-left py-1.5 px-2 text-[8px] uppercase text-neutral-500 font-bold">Roll Number</th>
                                        <th className="text-left py-1.5 px-2 text-[8px] uppercase text-neutral-500 font-bold">Joined</th>
                                        <th className="text-left py-1.5 px-2 text-[8px] uppercase text-neutral-500 font-bold">Duration</th>
                                        <th className="text-left py-1.5 px-2 text-[8px] uppercase text-neutral-500 font-bold">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {attendanceData.map((a, idx) => (
                                        <tr key={a.id} className={`border-b ${borderClass}`}>
                                          <td className="py-1.5 px-2 text-neutral-500">{idx + 1}</td>
                                          <td className="py-1.5 px-2 font-medium">{a.studentName || '—'}</td>
                                          <td className="py-1.5 px-2 font-bold">{a.rollNumber || '—'}</td>
                                          <td className="py-1.5 px-2">{formatTime(a.joinedAt)}</td>
                                          <td className="py-1.5 px-2">{formatDuration(a.joinedAt, a.leftAt)}</td>
                                          <td className="py-1.5 px-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase ${a.status === 'completed' ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')}`}>
                                              {a.status || 'unknown'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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

