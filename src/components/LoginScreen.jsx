import React, { useState } from 'react';
import { Sun, Moon, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ isDark, setIsDark }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [role, setRole] = useState('student');
  const [semester, setSemester] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const cardClass = isDark ? 'bg-neutral-900' : 'bg-white shadow-lg';
  const themeClass = isDark ? 'bg-neutral-950 text-neutral-200' : 'bg-neutral-50 text-neutral-900';
  const inputClass = isDark
    ? 'bg-black border-neutral-800 placeholder:text-neutral-700 text-neutral-200'
    : 'bg-white border-neutral-300 text-black placeholder:text-neutral-400';

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }

    if (mode === 'signup') {
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
      if (!fullName.trim()) { setError('Full name is required.'); return; }
      if (role === 'student' && !rollNumber.trim()) { setError('Roll number is required for students.'); return; }
      if (role === 'student' && !semester) { setError('Please select your current semester.'); return; }
      if (role === 'admin' && adminKey !== 'COLLABLAB_MASTER_2025') { setError('Invalid admin master key.'); return; }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp({ email: email.trim(), password, role, fullName: fullName.trim(), rollNumber: rollNumber.trim(), semester: role === 'student' ? parseInt(semester) : null });
      }
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with this email.'
        : err.code === 'auth/wrong-password' ? 'Incorrect password.'
        : err.code === 'auth/invalid-credential' ? 'Invalid email or password.'
        : err.code === 'auth/email-already-in-use' ? 'This email is already registered. Sign in instead.'
        : err.code === 'auth/invalid-email' ? 'Please enter a valid email address.'
        : err.message || 'Authentication failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className={`w-screen h-screen flex items-center justify-center font-mono ${themeClass}`}>
      <div className={`${cardClass} border ${borderClass} p-8 rounded-xl max-w-md w-full transition-all duration-300`}>
        <div className={`mb-6 border-b pb-4 flex justify-between items-center ${borderClass}`}>
          <div>
            <h1 className="text-base font-bold uppercase tracking-wider">CollabLab</h1>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-neutral-200/20 transition"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] px-3 py-2 rounded mb-4 font-bold">
            ⚠ {error}
          </div>
        )}

        <div className="space-y-3">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-[10px] uppercase text-neutral-500 mb-1.5 font-bold">Role</label>
                <div className={`grid grid-cols-3 gap-1 p-1 rounded border ${isDark ? 'bg-black border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                  <button
                    onClick={() => setRole('student')}
                    className={`py-1.5 text-xs font-medium rounded transition ${role === 'student' ? (isDark ? 'bg-neutral-800 text-white' : 'bg-white text-black shadow-sm') : 'text-neutral-500'}`}
                  >
                    Student
                  </button>
                  <button
                    onClick={() => setRole('professor')}
                    className={`py-1.5 text-xs font-medium rounded transition ${role === 'professor' ? (isDark ? 'bg-neutral-800 text-white' : 'bg-white text-black shadow-sm') : 'text-neutral-500'}`}
                  >
                    Professor
                  </button>
                  <button
                    onClick={() => setRole('admin')}
                    className={`py-1.5 text-xs font-medium rounded transition ${role === 'admin' ? (isDark ? 'bg-red-900/60 text-red-300' : 'bg-red-100 text-red-700 shadow-sm') : 'text-neutral-500'}`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-500 mb-1 font-bold">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Rahul Kumar"
                  className={`w-full border rounded px-2.5 py-2 text-xs focus:outline-none transition ${inputClass}`}
                />
              </div>

              {role === 'student' && (
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 mb-1 font-bold">Roll Number</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={e => setRollNumber(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. 2301CS001"
                    className={`w-full border rounded px-2.5 py-2 text-xs focus:outline-none transition ${inputClass}`}
                  />
                </div>
              )}

              {role === 'student' && (
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 mb-1 font-bold">Semester</label>
                  <select
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    className={`w-full border rounded px-2.5 py-2 text-xs focus:outline-none transition ${inputClass}`}
                  >
                    <option value="">Select your semester...</option>
                    {[1,2,3,4,5,6,7].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              )}

              {role === 'admin' && (
                <div>
                  <label className="block text-[10px] uppercase text-red-500 mb-1 font-bold">Master Key</label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={e => setAdminKey(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter admin master key"
                    className={`w-full border rounded px-2.5 py-2 text-xs focus:outline-none transition ${isDark ? 'bg-black border-red-900/50 placeholder:text-neutral-700 text-red-300' : 'bg-white border-red-300 text-red-700 placeholder:text-red-300'}`}
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-[10px] uppercase text-neutral-500 mb-1 font-bold">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you@college.edu"
              className={`w-full border rounded px-2.5 py-2 text-xs focus:outline-none transition ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-neutral-500 mb-1 font-bold">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className={`w-full border rounded px-2.5 py-2 text-xs focus:outline-none transition pr-8 ${inputClass}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
              >
                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] uppercase text-neutral-500 mb-1 font-bold">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className={`w-full border rounded px-2.5 py-2 text-xs focus:outline-none transition ${inputClass}`}
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full text-xs font-bold py-2.5 px-4 rounded transition uppercase tracking-wider mt-2 disabled:opacity-50 ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
          >
            {isSubmitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <div className={`mt-5 pt-4 border-t text-center ${borderClass}`}>
          {mode === 'signin' ? (
            <p className="text-[10px] text-neutral-500">
              Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); }} className="text-emerald-500 font-bold hover:underline">
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-[10px] text-neutral-500">
              Already have an account?{' '}
              <button onClick={() => { setMode('signin'); setError(''); }} className="text-emerald-500 font-bold hover:underline">
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
