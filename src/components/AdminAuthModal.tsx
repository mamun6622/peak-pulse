import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, AlertCircle, Eye, EyeOff, ShieldCheck, CheckCircle2, LogOut, Cloud, Flame } from 'lucide-react';
import { verifyAdminPasskey, updateAdminPasskey } from '../services/authService';
import { loginWithGoogle, logoutFirebase, auth } from '../services/firebase';
import { User } from 'firebase/auth';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  isAdmin?: boolean;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isAdmin = false,
}) => {
  const [passkey, setPasskey] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  // Change passkey sub-form states
  const [activeTab, setActiveTab] = useState<'login' | 'change_key' | 'firebase'>(isAdmin ? 'firebase' : 'login');
  const [currentKeyInput, setCurrentKeyInput] = useState<string>('');
  const [newKeyInput, setNewKeyInput] = useState<string>('');
  const [confirmKeyInput, setConfirmKeyInput] = useState<string>('');
  const [changeError, setChangeError] = useState<string>('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSigningInWithGoogle(true);
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
      onLoginSuccess();
      setSuccessMsg(`Signed in as ${user.displayName || user.email}!`);
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  const handleFirebaseSignOut = async () => {
    try {
      await logoutFirebase();
      setCurrentUser(null);
      setSuccessMsg('Signed out of Firebase account.');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      setError('Failed to sign out of Firebase.');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setError('Please enter your owner passkey.');
      return;
    }

    if (verifyAdminPasskey(passkey)) {
      onLoginSuccess();
      onClose();
      setPasskey('');
      setError('');
    } else {
      setError('Incorrect passkey. Access denied.');
    }
  };

  const handleChangeKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setSuccessMsg('');

    if (!verifyAdminPasskey(currentKeyInput)) {
      setChangeError('Current passkey is incorrect.');
      return;
    }

    if (newKeyInput.trim().length < 4) {
      setChangeError('New passkey must be at least 4 characters long.');
      return;
    }

    if (newKeyInput !== confirmKeyInput) {
      setChangeError('New passkeys do not match.');
      return;
    }

    const ok = updateAdminPasskey(newKeyInput);
    if (ok) {
      setSuccessMsg('Private passkey updated! Only you now have access.');
      setCurrentKeyInput('');
      setNewKeyInput('');
      setConfirmKeyInput('');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1500);
    } else {
      setChangeError('Failed to save new passkey. Please check storage permissions.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
                <span>{isAdmin ? 'Security & Firebase' : 'Owner Admin Access'}</span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  <Flame className="w-3 h-3 text-orange-400" /> Firebase
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                {isAdmin ? 'Manage authentication & cloud sync' : 'Restricted private access for portfolio owner'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-stone-950 border border-stone-800 rounded-xl text-xs font-medium">
          {!isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                activeTab === 'login'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Owner Login
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
              activeTab === 'firebase'
                ? 'bg-amber-400 text-stone-950 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Firebase Auth
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('change_key')}
              className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                activeTab === 'change_key'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Private Passkey
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Firebase Google Auth */}
        {activeTab === 'firebase' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-sky-400" /> Cloud Sync Status:
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active (asia-south1)
                </span>
              </div>
              <div className="text-[11px] text-stone-400 font-mono break-all bg-stone-900/80 p-2 rounded-lg border border-stone-800/80">
                Project: massive-platform-sds98
              </div>
            </div>

            {currentUser ? (
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-10 h-10 rounded-full border border-stone-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-stone-100 truncate">
                      {currentUser.displayName || 'Authenticated User'}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate">{currentUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleFirebaseSignOut}
                    className="flex-1 py-2 px-3 text-xs font-medium text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-800 rounded-xl border border-stone-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out from Firebase
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2 px-4 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-stone-300 leading-relaxed">
                  Sign in with your Google account to sync your summit logs, photos, and running workouts securely to Firestore Cloud.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningInWithGoogle}
                  className="w-full py-2.5 px-4 bg-white hover:bg-stone-100 text-stone-900 text-xs font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isSigningInWithGoogle ? 'Connecting to Google...' : 'Sign in with Google (Firebase)'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Change Passkey Form */}
        {activeTab === 'change_key' && isAdmin && (
          <form onSubmit={handleChangeKeySubmit} className="space-y-3.5">
            {changeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-stone-300 block mb-1">
                Current Passkey
              </label>
              <input
                type="password"
                placeholder="Enter current passkey"
                value={currentKeyInput}
                onChange={(e) => setCurrentKeyInput(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-stone-300 block mb-1">
                New Private Passkey (Only you know this)
              </label>
              <input
                type="password"
                placeholder="Enter new private passkey"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-stone-300 block mb-1">
                Confirm New Passkey
              </label>
              <input
                type="password"
                placeholder="Repeat new private passkey"
                value={confirmKeyInput}
                onChange={(e) => setConfirmKeyInput(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium text-stone-400 hover:text-stone-200"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm"
              >
                Save Private Passkey
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Standard Passkey Login Form */}
        {activeTab === 'login' && !isAdmin && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-stone-300 block mb-1.5">
                Owner Passkey
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter private passkey..."
                  value={passkey}
                  onChange={(e) => {
                    setPasskey(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-stone-500 hover:text-stone-300 absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                🔒 Public viewers have read-only access. Only the portfolio owner can sign in.
              </p>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-stone-900 px-2 text-stone-500">Or authenticate with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningInWithGoogle}
              className="w-full py-2.5 px-3 bg-stone-800 hover:bg-stone-700/80 border border-stone-700 text-stone-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>{isSigningInWithGoogle ? 'Connecting...' : 'Sign in with Google (Firebase)'}</span>
            </button>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Unlock Admin Panel</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
