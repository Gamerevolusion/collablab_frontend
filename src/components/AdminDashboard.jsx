import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Trash2, BookOpen, GraduationCap, Users, Search, Edit3, Eye, BarChart3, X, Save, ChevronRight, UserCheck, Mail } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const SEMESTERS = [1, 2, 3, 4, 5, 6];
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:4000' 
  : 'https://collablab-backend.onrender.com';

export default function AdminDashboard({ isDark, onSignOut }) {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('subjects');

  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const cardClass = isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm';
  const inputClass = isDark
    ? 'bg-black border-neutral-800 placeholder:text-neutral-700 text-neutral-200'
    : 'bg-white border-neutral-300 text-black placeholder:text-neutral-400';

  return (
    <div className={`w-screen h-screen flex flex-col font-mono overflow-hidden transition-colors duration-300 ${isDark ? 'bg-neutral-950 text-neutral-200' : 'bg-neutral-50 text-neutral-900'}`}>
      <header className={`border-b px-6 py-3 flex items-center justify-between ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-wider">CollabLab</span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>Admin</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-neutral-500">{userProfile?.displayName || user?.email}</span>
          <button onClick={onSignOut} className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-500 text-white px-2.5 py-1 rounded transition font-bold uppercase">
            <LogOut size={10} /> Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className={`flex border-b ${borderClass}`}>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider transition ${
            activeTab === 'subjects'
              ? (isDark ? 'border-b-2 border-red-500 text-red-400' : 'border-b-2 border-red-600 text-red-700')
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-1.5"><GraduationCap size={11} /> Subjects</div>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider transition ${
            activeTab === 'students'
              ? (isDark ? 'border-b-2 border-red-500 text-red-400' : 'border-b-2 border-red-600 text-red-700')
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-1.5"><Users size={11} /> Students</div>
       </button>
        <button
          onClick={() => setActiveTab('professors')}
          className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider transition ${
            activeTab === 'professors'
              ? (isDark ? 'border-b-2 border-red-500 text-red-400' : 'border-b-2 border-red-600 text-red-700')
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-1.5"><UserCheck size={11} /> Professors</div>
       </button>
     </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'subjects' ? (
          <SubjectsTab isDark={isDark} user={user} borderClass={borderClass} cardClass={cardClass} inputClass={inputClass} />
        ) : activeTab === 'students' ? (
          <StudentsTab isDark={isDark} borderClass={borderClass} cardClass={cardClass} inputClass={inputClass} />
        ) : (
          <ProfessorsTab isDark={isDark} borderClass={borderClass} cardClass={cardClass} inputClass={inputClass} />
        )}
     </div>
   </div>
  );
}

// ──────────────────────── Subjects Tab ────────────────────────

function SubjectsTab({ isDark, user, borderClass, cardClass, inputClass }) {
  const [selectedSem, setSelectedSem] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSubjects = async (sem) => {
    setLoading(true);
    try {
      const q = query(collection(db, 'subjects'), where('semester', '==', sem), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(selectedSem); }, [selectedSem]);

  const handleAddSubject = async () => {
    const name = newSubject.trim();
    if (!name) return;
    if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'subjects'), { name, semester: selectedSem, createdAt: serverTimestamp(), createdBy: user.uid });
      setNewSubject('');
      await fetchSubjects(selectedSem);
    } catch (err) { console.error('Failed to add subject:', err); }
    finally { setSaving(false); }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await deleteDoc(doc(db, 'subjects', subjectId));
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
    } catch (err) { console.error('Failed to delete subject:', err); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className={`border rounded-xl p-5 ${cardClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap size={16} className={isDark ? 'text-red-400' : 'text-red-600'} />
          <div className="text-sm font-bold">Semester & Subject Management</div>
        </div>
        <p className={`text-[10px] mb-4 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
          Select a semester and add practical subjects. Professors will choose from these when creating sessions.
        </p>

        <div className="flex gap-2 mb-5">
          {SEMESTERS.map(sem => (
            <button
              key={sem}
              onClick={() => setSelectedSem(sem)}
              className={`w-10 h-10 rounded-lg text-xs font-bold transition ${
                selectedSem === sem
                  ? 'bg-red-600 text-white'
                  : isDark ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {sem}
            </button>
          ))}
        </div>

        <div className="text-[10px] font-bold uppercase text-neutral-500 mb-3">
          Semester {selectedSem} — Practical Subjects
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newSubject}
            onChange={e => setNewSubject(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
            placeholder="e.g. Data Structures Lab, DBMS Lab..."
            className={`flex-1 border rounded px-3 py-2 text-xs focus:outline-none transition ${inputClass}`}
          />
          <button
            onClick={handleAddSubject}
            disabled={!newSubject.trim() || saving}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-4 py-2 rounded text-xs font-bold uppercase transition"
          >
            <Plus size={12} /> Add
          </button>
        </div>

        {loading ? (
          <div className="text-[10px] text-neutral-500 text-center py-6">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-6">
            <BookOpen size={20} className="mx-auto mb-2 text-neutral-600" />
            <div className="text-[10px] text-neutral-500">No subjects added for Semester {selectedSem} yet.</div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {subjects.map((sub, idx) => (
              <div
                key={sub.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded border transition ${isDark ? 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800/50' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-200 text-neutral-500'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium">{sub.name}</span>
                </div>
                <button onClick={() => handleDeleteSubject(sub.id)} className="text-red-500 hover:text-red-400 transition p-1" title="Delete subject">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={`mt-4 pt-3 border-t text-[9px] text-neutral-600 ${borderClass}`}>
          Total: {subjects.length} subject{subjects.length !== 1 ? 's' : ''} in Semester {selectedSem}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────── Students Tab ────────────────────────

function StudentsTab({ isDark, borderClass, cardClass, inputClass }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('');
  const [filterDegree, setFilterDegree] = useState('');
  const [filterRoll, setFilterRoll] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRoll, setEditRoll] = useState('');
  const [saving, setSaving] = useState(false);
  const [totalSessions, setTotalSessions] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'), limit(50));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const roll = s.rollNumber || '';
    if (filterYear && !roll.startsWith(filterYear)) return false;
    if (filterDegree && roll.length >= 6 && roll.substring(4, 6) !== filterDegree) return false;
    if (filterRoll && roll.length >= 9 && !roll.substring(6).includes(filterRoll)) return false;
    return true;
  });

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setEditing(false);
    setEditName(student.displayName || '');
    setEditRoll(student.rollNumber || '');
    setLoadingAttendance(true);
    try {
      // Fetch this student's session participations
      const q = query(
        collection(db, 'sessionParticipants'),
        where('studentUid', '==', student.id)
      );
      const snap = await getDocs(q);
      const attendance = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudentAttendance(attendance);

      // Fetch total sessions per subject for student's semester
      if (student.semester) {
        const sessQ = query(
          collection(db, 'sessions'),
          where('semester', '==', student.semester)
        );
        const sessSnap = await getDocs(sessQ);
        const counts = {};
        sessSnap.docs.forEach(d => {
          const subj = d.data().subject || 'Unknown';
          counts[subj] = (counts[subj] || 0) + 1;
        });
        setTotalSessions(counts);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setStudentAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', selectedStudent.id), {
        displayName: editName.trim(),
        rollNumber: editRoll.trim(),
      });
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, displayName: editName.trim(), rollNumber: editRoll.trim() } : s));
      setSelectedStudent(prev => ({ ...prev, displayName: editName.trim(), rollNumber: editRoll.trim() }));
      setEditing(false);
    } catch (err) {
      console.error('Failed to update student:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Delete ${student.displayName || student.email}? This will remove their Firestore profile. The authentication account can only be deleted by the backend (which may not be configured).`)) return;
    
    let authDeleted = false;
    let errorMessage = '';
    
    try {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch(`${BACKEND_URL}/api/delete-user`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: student.id }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          authDeleted = true;
          const data = await res.json();
          console.log('Auth account deleted:', data);
        } else {
          const data = await res.json().catch(() => ({}));
          if (res.status === 500 && data.error?.includes('Firebase Admin SDK')) {
            errorMessage = 'Backend not configured (FIREBASE_SERVICE_ACCOUNT missing on server). Only their Firestore profile was deleted - the auth account still exists.';
          } else {
            errorMessage = `Backend error: ${data.error || res.statusText}. Only their Firestore profile was deleted - the auth account still exists.`;
          }
          console.warn('Backend delete failed:', errorMessage);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          errorMessage = 'Backend request timed out. Only their Firestore profile was deleted - the auth account still exists.';
        } else {
          errorMessage = `Backend unreachable (${err.message}). Only their Firestore profile was deleted - the auth account still exists.`;
        }
        console.warn('Backend delete failed, removing Firestore profile only:', err);
      }
      
      // Always delete Firestore profile
      await deleteDoc(doc(db, 'users', student.id));
      setStudents(prev => prev.filter(s => s.id !== student.id));
      if (selectedStudent?.id === student.id) setSelectedStudent(null);
      
      if (authDeleted) {
        console.log(`Successfully deleted ${student.email} (auth + Firestore profile)`);
      } else if (errorMessage) {
        alert(errorMessage);
      }
    } catch (err) {
      console.error('Failed to delete student:', err);
      alert('Failed to delete student: ' + err.message);
    }
  };

  // Calculate attendance per subject
  const getAttendanceBySubject = () => {
    const bySubject = {};
    studentAttendance.forEach(a => {
      const subj = a.subject || 'Unknown';
      bySubject[subj] = (bySubject[subj] || 0) + 1;
    });
    return bySubject;
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="max-w-6xl mx-auto flex gap-6">
      {/* Student List */}
      <div className={`flex-1 border rounded-xl p-5 ${cardClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className={isDark ? 'text-red-400' : 'text-red-600'} />
          <div className="text-sm font-bold">Student Management</div>
          <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
            {filteredStudents.length} / {students.length}
          </span>
        </div>

        {/* Filters */}
        <div className={`flex gap-2 mb-4 p-3 rounded border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
          <div className="flex-1">
            <label className="block text-[8px] uppercase text-neutral-500 font-bold mb-1">Year</label>
            <input
              type="text"
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              placeholder="e.g. 2024"
              maxLength={4}
              className={`w-full border rounded px-2 py-1.5 text-[10px] focus:outline-none ${inputClass}`}
            />
          </div>
          <div className="flex-1">
            <label className="block text-[8px] uppercase text-neutral-500 font-bold mb-1">Degree Code</label>
            <input
              type="text"
              value={filterDegree}
              onChange={e => setFilterDegree(e.target.value)}
              placeholder="e.g. 03"
              maxLength={2}
              className={`w-full border rounded px-2 py-1.5 text-[10px] focus:outline-none ${inputClass}`}
            />
          </div>
          <div className="flex-1">
            <label className="block text-[8px] uppercase text-neutral-500 font-bold mb-1">Roll No.</label>
            <input
              type="text"
              value={filterRoll}
              onChange={e => setFilterRoll(e.target.value)}
              placeholder="e.g. 001"
              maxLength={3}
              className={`w-full border rounded px-2 py-1.5 text-[10px] focus:outline-none ${inputClass}`}
            />
          </div>
        </div>

        {/* Student List */}
        {loading ? (
          <div className="text-[10px] text-neutral-500 text-center py-8">Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <Users size={20} className="mx-auto mb-2 text-neutral-600" />
            <div className="text-[10px] text-neutral-500">No students found matching filters.</div>
          </div>
        ) : (
          <div className="space-y-1 max-h-[55vh] overflow-y-auto">
            {filteredStudents.map(s => (
              <div
                key={s.id}
                onClick={() => selectStudent(s)}
                className={`flex items-center justify-between px-3 py-2.5 rounded border cursor-pointer transition ${
                  selectedStudent?.id === s.id
                    ? (isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200')
                    : (isDark ? 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800/50' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                    {(s.displayName || 'S')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{s.displayName || 'Unknown'}</div>
                    <div className="text-[9px] text-neutral-500">{s.rollNumber || '—'} · Sem {s.semester || '?'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteStudent(s); }}
                    className="text-red-500 hover:text-red-400 transition p-1"
                    title="Delete student"
                  >
                    <Trash2 size={11} />
                  </button>
                  <ChevronRight size={12} className="text-neutral-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Detail Panel */}
      <div className={`w-[420px] border rounded-xl p-5 ${cardClass}`}>
        {!selectedStudent ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Eye size={24} className="mx-auto mb-3 text-neutral-600" />
              <div className="text-[10px] text-neutral-500">Select a student to view details</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Profile header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                  {(selectedStudent.displayName || 'S')[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold">{selectedStudent.displayName}</div>
                  <div className="text-[9px] text-neutral-500">{selectedStudent.email}</div>
                </div>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className={`p-1.5 rounded transition ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
              >
                <Edit3 size={12} className={editing ? 'text-red-400' : 'text-neutral-500'} />
              </button>
            </div>

            {/* Edit form */}
            {editing && (
              <div className={`p-3 rounded border space-y-2 ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                <div>
                  <label className="block text-[8px] uppercase text-neutral-500 font-bold mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className={`w-full border rounded px-2 py-1.5 text-xs focus:outline-none ${inputClass}`}
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase text-neutral-500 font-bold mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={editRoll}
                    onChange={e => setEditRoll(e.target.value)}
                    className={`w-full border rounded px-2 py-1.5 text-xs focus:outline-none ${inputClass}`}
                  />
                </div>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase transition"
                >
                  <Save size={10} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`rounded p-2 border text-center ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="text-[8px] text-neutral-500 uppercase font-bold">Roll No</div>
                <div className="text-[10px] font-bold mt-0.5">{selectedStudent.rollNumber || '—'}</div>
              </div>
              <div className={`rounded p-2 border text-center ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="text-[8px] text-neutral-500 uppercase font-bold">Semester</div>
                <div className="text-[10px] font-bold mt-0.5">{selectedStudent.semester || '—'}</div>
              </div>
              <div className={`rounded p-2 border text-center ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="text-[8px] text-neutral-500 uppercase font-bold">Sessions</div>
                <div className="text-[10px] font-bold mt-0.5">{studentAttendance.length}</div>
              </div>
            </div>

            {/* Attendance by subject */}
            <div>
              <div className="text-[9px] font-bold uppercase text-neutral-500 mb-2 flex items-center gap-1">
                <BarChart3 size={9} /> Attendance by Subject
              </div>
              {loadingAttendance ? (
                <div className="text-[9px] text-neutral-600 py-2">Loading...</div>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(getAttendanceBySubject()).length === 0 ? (
                    <div className="text-[9px] text-neutral-600">No attendance records found.</div>
                  ) : (
                    Object.entries(getAttendanceBySubject()).map(([subject, attended]) => {
                      const total = totalSessions[subject] || attended;
                      const pct = Math.round((attended / total) * 100);
                      return (
                        <div key={subject} className={`p-2 rounded border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-medium">{subject}</span>
                            <span className={`text-[9px] font-bold ${pct >= 75 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                              {attended}/{total} ({pct}%)
                            </span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Session history */}
            <div>
              <div className="text-[9px] font-bold uppercase text-neutral-500 mb-2">Session History</div>
              {loadingAttendance ? (
                <div className="text-[9px] text-neutral-600 py-2">Loading...</div>
              ) : studentAttendance.length === 0 ? (
                <div className="text-[9px] text-neutral-600">No sessions attended.</div>
              ) : (
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {studentAttendance.map(a => (
                    <div key={a.id} className={`flex items-center justify-between px-2 py-1.5 rounded border text-[9px] ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                      <div>
                        <span className="font-bold">{a.subject || a.lobbyCode || '—'}</span>
                        <span className="text-neutral-500 ml-2">{formatDate(a.joinedAt)}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase ${a.status === 'completed' ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')}`}>
                        {a.status || 'unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete button */}
            <button
              onClick={() => handleDeleteStudent(selectedStudent)}
              className="w-full flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-500 text-white px-3 py-2 rounded text-[10px] font-bold uppercase transition mt-2"
            >
              <Trash2 size={10} /> Delete This Student
           </button>
         </div>
        )}
     </div>
   </div>
  );
}

// ──────────────────────── Professors Tab ────────────────────────

function ProfessorsTab({ isDark, borderClass, cardClass, inputClass }) {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSem, setFilterSem] = useState('');
  const [filterName, setFilterName] = useState('');
  const [selectedProf, setSelectedProf] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSemesters, setEditSemesters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [profStats, setProfStats] = useState({ sessions: 0, students: 0 });

  const fetchProfessors = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'professor'), limit(100));
      const snap = await getDocs(q);
      setProfessors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load professors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfessors(); }, []);

  const filteredProfs = professors.filter(p => {
    if (filterSem && !(p.semesters || []).includes(parseInt(filterSem))) return false;
    if (filterName && !(p.displayName || '').toLowerCase().includes(filterName.toLowerCase())) return false;
    return true;
  });

  const selectProfessor = async (prof) => {
    setSelectedProf(prof);
    setEditing(false);
    setEditName(prof.displayName || '');
    setEditSemesters(Array.isArray(prof.semesters) ? prof.semesters : []);
    try {
      const sessQ = query(collection(db, 'sessions'), where('professorUid', '==', prof.id));
      const sessSnap = await getDocs(sessQ);
      const sessIds = sessSnap.docs.map(d => d.id);
      let totalStudents = 0;
      if (sessIds.length > 0) {
        const partQ = query(collection(db, 'sessionParticipants'), where('sessionId', 'in', sessIds.slice(0, 10)));
        const partSnap = await getDocs(partQ);
        totalStudents = partSnap.size;
      }
      setProfStats({ sessions: sessSnap.size, students: totalStudents });
    } catch (err) {
      console.error('Failed to load professor stats:', err);
      setProfStats({ sessions: 0, students: 0 });
    }
  };

  const toggleEditSemester = (s) => {
    setEditSemesters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSaveEdit = async () => {
    if (!selectedProf) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', selectedProf.id), {
        displayName: editName.trim(),
        semesters: editSemesters,
      });
      setProfessors(prev => prev.map(p => p.id === selectedProf.id ? { ...p, displayName: editName.trim(), semesters: editSemesters } : p));
      setSelectedProf(prev => ({ ...prev, displayName: editName.trim(), semesters: editSemesters }));
      setEditing(false);
    } catch (err) {
      console.error('Failed to update professor:', err);
      alert('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfessor = async (prof) => {
    if (!window.confirm(`Delete ${prof.displayName || prof.email}? This will remove their Firestore profile. Their auth account also needs backend deletion.`)) return;
    let errorMessage = '';
    try {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${BACKEND_URL}/api/delete-user`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: prof.id }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 500 && data.error?.includes('Firebase Admin SDK')) {
            errorMessage = 'Backend not configured. Only Firestore profile deleted - auth still exists.';
          } else {
            errorMessage = `Backend error: ${data.error || res.statusText}`;
          }
        }
      } catch (err) {
        errorMessage = `Backend unreachable (${err.message}). Only Firestore profile deleted.`;
      }
      await deleteDoc(doc(db, 'users', prof.id));
      setProfessors(prev => prev.filter(p => p.id !== prof.id));
      if (selectedProf?.id === prof.id) setSelectedProf(null);
      if (errorMessage) alert(errorMessage);
    } catch (err) {
      console.error(err);
      alert('Failed to delete: ' + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex gap-6">
      {/* List */}
      <div className={`flex-1 border rounded-xl p-5 ${cardClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <UserCheck size={16} className={isDark ? 'text-red-400' : 'text-red-600'} />
          <div className="text-sm font-bold">Professor Management</div>
          <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
            {filteredProfs.length} / {professors.length}
         </span>
       </div>

        <div className={`flex gap-2 mb-4 p-3 rounded border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
          <div className="flex-1">
            <label className="block text-[8px] uppercase text-neutral-500 font-bold mb-1">Filter by Semester</label>
            <select
              value={filterSem}
              onChange={e => setFilterSem(e.target.value)}
              className={`w-full border rounded px-2 py-1.5 text-[10px] focus:outline-none ${inputClass}`}
            >
              <option value="">All Semesters</option>
              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
           </select>
         </div>
          <div className="flex-1">
            <label className="block text-[8px] uppercase text-neutral-500 font-bold mb-1">Search by Name</label>
            <input
              type="text"
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              placeholder="e.g. Sharma"
              className={`w-full border rounded px-2 py-1.5 text-[10px] focus:outline-none ${inputClass}`}
            />
         </div>
       </div>

        {loading ? (
          <div className="text-[10px] text-neutral-500 text-center py-8">Loading professors</div>
        ) : filteredProfs.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck size={20} className="mx-auto mb-2 text-neutral-600" />
            <div className="text-[10px] text-neutral-500">No professors found</div>
            <div className="text-[9px] text-neutral-600 mt-1">Professors sign up by choosing the "Professor" role</div>
         </div>
        ) : (
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {filteredProfs.map(p => (
              <button
                key={p.id}
                onClick={() => selectProfessor(p)}
                className={`w-full text-left p-3 rounded border transition flex items-center justify-between ${
                  selectedProf?.id === p.id
                    ? (isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300')
                    : (isDark ? 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800/50' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100')
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">{p.displayName || p.email}</div>
                  <div className="text-[9px] text-neutral-500 truncate">{p.email}</div>
               </div>
                <div className="flex gap-1 ml-2 flex-wrap justify-end">
                  {(p.semesters || []).slice(0, 3).map(s => (
                    <span key={s} className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                      S{s}
                   </span>
                  ))}
                  {(!p.semesters || p.semesters.length === 0) && (
                    <span className="text-[8px] text-neutral-600">None</span>
                  )}
               </div>
             </button>
            ))}
         </div>
        )}
     </div>

      {/* Detail Panel */}
      <div className={`w-80 border rounded-xl p-5 ${cardClass}`}>
        {selectedProf ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                {(selectedProf.displayName || 'P')[0].toUpperCase()}
             </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className={`w-full text-xs font-bold border rounded px-2 py-1 ${inputClass}`}
                  />
                ) : (
                  <div className="text-sm font-bold truncate">{selectedProf.displayName || 'Professor'}</div>
                )}
               <div className="text-[10px] text-neutral-500 truncate">{selectedProf.email}</div>
             </div>
           </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-lg p-2 border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="text-[8px] text-neutral-500 uppercase font-bold">Sessions</div>
                <div className="text-xs font-bold">{profStats.sessions}</div>
             </div>
              <div className={`rounded-lg p-2 border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                <div className="text-[8px] text-neutral-500 uppercase font-bold">Students</div>
                <div className="text-xs font-bold">{profStats.students}</div>
             </div>
           </div>

            <div>
              <div className="text-[9px] text-neutral-500 uppercase font-bold mb-2">Semesters Teaching</div>
              {editing ? (
                <div className={`grid grid-cols-3 gap-1 p-1 rounded border ${isDark ? 'bg-black border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                  {SEMESTERS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleEditSemester(s)}
                      className={`py-1.5 text-xs font-medium rounded transition ${
                        editSemesters.includes(s)
                          ? (isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white')
                          : 'text-neutral-500'
                      }`}
                    >
                      Sem {s}
                   </button>
                  ))}
               </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {(selectedProf.semesters || []).length === 0 ? (
                    <span className="text-[10px] text-neutral-600">No semesters assigned</span>
                  ) : (
                    (selectedProf.semesters || []).map(s => (
                      <span key={s} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                        Semester {s}
                     </span>
                    ))
                  )}
               </div>
              )}
           </div>

            <div>
              <div className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Email</div>
              <div className="text-[10px] font-mono flex items-center gap-1">
                <Mail size={10} className="text-neutral-500" /> {selectedProf.email}
             </div>
           </div>

            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={() => { setEditing(false); setEditName(selectedProf.displayName); setEditSemesters(selectedProf.semesters || []); }}
                    className={`flex-1 px-3 py-2 rounded text-[10px] font-bold uppercase transition ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'}`}
                  >
                    Cancel
                 </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving || !editName.trim()}
                    className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3 py-2 rounded text-[10px] font-bold uppercase transition"
                  >
                    <Save size={10} /> Save
                 </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-[10px] font-bold uppercase transition ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'}`}
                >
                  <Edit3 size={10} /> Edit Details
               </button>
              )}
           </div>

            <button
              onClick={() => handleDeleteProfessor(selectedProf)}
              className="w-full flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-500 text-white px-3 py-2 rounded text-[10px] font-bold uppercase transition"
            >
              <Trash2 size={10} /> Delete Professor
           </button>
         </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <UserCheck size={24} className="text-neutral-600 mb-3" />
            <div className="text-xs text-neutral-500">Select a professor to view details</div>
            <div className="text-[10px] text-neutral-600 mt-1">Click on any row to see assigned semesters, stats, and edit options</div>
         </div>
        )}
     </div>
   </div>
  );
}


