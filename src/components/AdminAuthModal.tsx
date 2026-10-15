import React, { useState } from 'react';
import { X, Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [passkey, setPasskey] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default passkeys accepted: 'admin2026', 'mamun2026', or 'korea'
    const clean = passkey.trim().toLowerCase();
    if (clean === 'admin2026' || clean === 'mamun2026' || clean === 'korea' || clean === 'summit') {
      onLoginSuccess();
      onClose();
      setPasskey('');
      setError('');
    } else {
      setError('Invalid passkey. (Default: admin2026)');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100">Owner Admin Access</h3>
              <p className="text-[11px] text-stone-400">Unlock summit editor & log permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-stone-300 block mb-1.5">
              Enter Admin Passkey
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Enter passkey..."
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5 font-mono">
              Default owner passkey: <span className="text-amber-400 font-semibold">admin2026</span>
            </p>
          </div>

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
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Unlock Admin Panel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
