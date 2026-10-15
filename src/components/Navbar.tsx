import React from 'react';
import { Mountain, Plus, Download, Lock, ShieldCheck, LogOut } from 'lucide-react';

interface NavbarProps {
  activeTab: 'summits' | 'running' | 'stats' | 'map' | 'photos';
  onSelectTab: (tab: 'summits' | 'running' | 'stats' | 'map' | 'photos') => void;
  isAdmin: boolean;
  onOpenLogModal: () => void;
  onOpenDataModal: () => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isAdmin,
  onOpenLogModal,
  onOpenDataModal,
  onOpenAdminLogin,
  onLogoutAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Brand wordmark (single text element) */}
        <button
          onClick={() => onSelectTab('summits')}
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-1"
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
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-stone-400" aria-label="Main Navigation">
          <button
            onClick={() => onSelectTab('summits')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-100 ${
              activeTab === 'summits' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Mountain Summits
          </button>
          <button
            onClick={() => onSelectTab('running')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-100 ${
              activeTab === 'running' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Running Logs
          </button>
          <button
            onClick={() => onSelectTab('stats')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-100 ${
              activeTab === 'stats' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Monthly Statistics
          </button>
          <button
            onClick={() => onSelectTab('map')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-100 ${
              activeTab === 'map' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Korea Peak Map
          </button>
          <button
            onClick={() => onSelectTab('photos')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-100 ${
              activeTab === 'photos' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Photo Archive
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Admin Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {isAdmin ? (
            <>
              {/* Admin Active Tag */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </div>

              <button
                onClick={onOpenDataModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-stone-100 bg-stone-900 border border-stone-800 rounded-lg hover:bg-stone-850 transition-colors whitespace-nowrap shrink-0"
                title="Backup, export, or reset data"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Data</span>
              </button>

              <button
                onClick={onOpenLogModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] transition-all rounded-lg shadow-sm whitespace-nowrap shrink-0"
                aria-label="Log new outdoor activity"
              >
                <Plus className="w-4 h-4" />
                <span>+ Log Ascent</span>
              </button>

              <button
                onClick={onLogoutAdmin}
                className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
                title="Switch back to Viewer Mode"
                aria-label="Exit admin mode"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Viewer Mode Pill Indicator */}
              <span className="hidden sm:inline-block text-[11px] font-mono text-stone-500 px-2 py-1 rounded border border-stone-850">
                Viewer Mode
              </span>

              <button
                onClick={onOpenAdminLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-stone-900 hover:bg-stone-850 border border-amber-500/30 hover:border-amber-500/60 rounded-lg transition-all whitespace-nowrap shrink-0 shadow-sm"
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
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'summits' ? 'text-amber-400 font-semibold bg-stone-900' : ''
            }`}
          >
            Summits
          </button>
          <button
            onClick={() => onSelectTab('running')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'running' ? 'text-amber-400 font-semibold bg-stone-900' : ''
            }`}
          >
            Running
          </button>
          <button
            onClick={() => onSelectTab('stats')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'stats' ? 'text-amber-400 font-semibold bg-stone-900' : ''
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => onSelectTab('map')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'map' ? 'text-amber-400 font-semibold bg-stone-900' : ''
            }`}
          >
            Map
          </button>
          <button
            onClick={() => onSelectTab('photos')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'photos' ? 'text-amber-400 font-semibold bg-stone-900' : ''
            }`}
          >
            Photos
          </button>
        </div>

        {isAdmin ? (
          <button
            onClick={onOpenLogModal}
            className="px-2 py-1 text-xs font-bold text-stone-950 bg-amber-400 rounded"
          >
            + Log
          </button>
        ) : (
          <button
            onClick={onOpenAdminLogin}
            className="px-2 py-1 text-[11px] font-semibold text-amber-400 border border-amber-500/30 rounded"
          >
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
