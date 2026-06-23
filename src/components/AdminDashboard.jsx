import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Trash2, BookOpen, GraduationCap } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7];

export default function AdminDashboard({ isDark, onSignOut }) {
  const { user, userProfile } = useAuth();
  const [selectedSem, setSelectedSem] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const cardClass = isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm';
  const inputClass = isDark
    ? 'bg-black border-neutral-800 placeholder:text-neutral-700 text-neutral-200'
    : 'bg-white border-neutral-300 text-black placeholder:text-neutral-400';

  const fetchSubjects = async (sem) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'subjects'),
        where('semester', '==', sem),
        orderBy('name', 'asc')
      );
      const snap = await getDocs(q);
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects(selectedSem);
  }, [selectedSem]);

  const handleAddSubject = async () => {
    const name = newSubject.trim();
    if (!name) return;

    const exists = subjects.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'subjects'), {
        name,
        semester: selectedSem,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setNewSubject('');
      await fetchSubjects(selectedSem);
    } catch (err) {
      console.error('Failed to add subject:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await deleteDoc(doc(db, 'subjects', subjectId));
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

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

      <div className="flex-1 overflow-y-auto p-6">
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

            <div className={`text-[10px] font-bold uppercase text-neutral-500 mb-3`}>
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
                    <button
                      onClick={() => handleDeleteSubject(sub.id)}
                      className="text-red-500 hover:text-red-400 transition p-1"
                      title="Delete subject"
                    >
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
      </div>
    </div>
  );
}
