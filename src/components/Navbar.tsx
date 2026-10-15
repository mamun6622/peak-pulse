import React from 'react';
import { Mountain, Plus, Download, Lock, ShieldCheck, LogOut, KeyRound, Flame, Compass } from 'lucide-react';

interface NavbarProps {
  activeTab: 'summits' | 'progress' | 'running' | 'stats' | 'map' | 'photos';
  onSelectTab: (tab: 'summits' | 'progress' | 'running' | 'stats' | 'map' | 'photos') => void;
  isAdmin: boolean;
  firebaseUserEmail?: string | null;
  onOpenLogModal: () => void;
  onOpenDataModal: () => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenSecurityModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isAdmin,
  firebaseUserEmail,
  onOpenLogModal,
  onOpenDataModal,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenSecurityModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={() => onSelectTab('summits')}
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-1 cursor-pointer"
          aria-label="PeakPulse Korea Home"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
            <Mountain className="w-4 h-4" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-stone-100 whitespace-nowrap shrink-0">
            PeakPulse <span className="text-amber-400">Korea</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-stone-400" aria-label="Main Navigation">
          <button
            onClick={() => onSelectTab('summits')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-100 cursor-pointer ${
              activeTab === 'summits' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Mountain Summits
          </button>
          <button
            onClick={() => onSelectTab('progress')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-100 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'progress' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Busan & Korea Progress</span>
          </button>
          <button
            onClick={() => onSelectTab('running')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-100 cursor-pointer ${
              activeTab === 'running' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Running Logs
          </button>
          <button
            onClick={() => onSelectTab('stats')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-100 cursor-pointer ${
              activeTab === 'stats' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Analytics & PRs
          </button>
          <button
            onClick={() => onSelectTab('map')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-100 cursor-pointer ${
              activeTab === 'map' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Korea Peak Map
          </button>
          <button
            onClick={() => onSelectTab('photos')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-100 cursor-pointer ${
              activeTab === 'photos' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Photo Archive
          </button>
        </nav>

        {/* Zone 3: Actions + Firebase & Admin Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Firebase Database Status Button */}
          <button
            onClick={onOpenSecurityModal || onOpenAdminLogin}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              firebaseUserEmail
                ? 'bg-stone-900 border-emerald-500/40 text-emerald-300 hover:border-emerald-500'
                : 'bg-stone-900 border-amber-500/40 text-amber-300 hover:border-amber-500'
            }`}
            title={
              firebaseUserEmail
                ? `Firebase Cloud Synced: ${firebaseUserEmail}`
                : 'Firebase Cloud: Disconnected (Click to sign in with Google)'
            }
          >
            <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="hidden xl:inline">
              {firebaseUserEmail ? 'DB Synced' : 'Sync to Cloud'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                firebaseUserEmail ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          {isAdmin ? (
            <>
              {/* Admin Active Tag */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </div>

              <button
                onClick={onOpenDataModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-stone-100 bg-stone-900 border border-stone-800 rounded-lg hover:bg-stone-850 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Backup, export, or sync data"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Data</span>
              </button>

              <button
                onClick={onOpenSecurityModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-300 hover:text-amber-300 bg-stone-900 border border-stone-800 rounded-lg hover:bg-stone-850 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Security & Passkey settings"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Passkey</span>
              </button>

              <button
                onClick={onOpenLogModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] transition-all rounded-lg shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
                aria-label="Log new outdoor activity"
              >
                <Plus className="w-4 h-4" />
                <span>+ Log Ascent</span>
              </button>

              <button
                onClick={onLogoutAdmin}
                className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                title="Switch back to Viewer Mode"
                aria-label="Exit admin mode"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onOpenAdminLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-stone-900 hover:bg-stone-850 border border-amber-500/30 hover:border-amber-500/60 rounded-lg transition-all whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
                aria-label="Admin Login for Owner"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="md:hidden flex items-center justify-between border-t border-stone-800/80 px-3 py-2 overflow-x-auto text-xs font-medium text-stone-400 gap-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectTab('summits')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
              activeTab === 'summits' ? 'text-amber-400 font-semibold bg-stone-900' : ''
            }`}
          >
            Summits
          </button>
          <button
            onClick={() => onSelectTab('progress')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'progress' ? 'text-amber-400 font-semibold bg-stone-900' : ''
            }`}
          >
            <span>Progress</span>
          </button>
          <button
            onClick={() => onSelectTab('running')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
              activeTab === 'running' ? 'text-amber-400 font-semibold bg-stone-900' : ''
            }`}
          >
            Running
          </button>
          <button
            onClick={() => onSelectTab('stats')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
              activeTab === 'stats' ? 'text-amber-400 font-semibold bg-stone-900' : ''
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => onSelectTab('map')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
              activeTab === 'map' ? 'text-amber-400 font-semibold bg-stone-900' : ''
            }`}
          >
            Map
          </button>
          <button
            onClick={() => onSelectTab('photos')}
            className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
              activeTab === 'photos' ? 'text-amber-400 font-semibold bg-stone-900' : ''
            }`}
          >
            Photos
          </button>
        </div>

        {isAdmin ? (
          <button
            onClick={onOpenLogModal}
            className="px-2 py-1 text-xs font-bold text-stone-950 bg-amber-400 rounded cursor-pointer shrink-0"
          >
            + Log
          </button>
        ) : (
          <button
            onClick={onOpenAdminLogin}
            className="px-2 py-1 text-[11px] font-semibold text-amber-400 border border-amber-500/30 rounded cursor-pointer shrink-0"
          >
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
