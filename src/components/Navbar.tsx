import React from 'react';
import { Mountain, Plus, Lock, ShieldCheck, LogOut, KeyRound, Compass } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

interface NavbarProps {
  activeTab: 'summits' | 'progress' | 'running' | 'stats' | 'map' | 'photos';
  onSelectTab: (tab: 'summits' | 'progress' | 'running' | 'stats' | 'map' | 'photos') => void;
  isAdmin: boolean;
  firebaseUserEmail?: string | null;
  onOpenLogModal: () => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenSecurityModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isAdmin,
  onOpenLogModal,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenSecurityModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={() => onSelectTab('summits')}
          className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg p-1 cursor-pointer shrink-0"
          aria-label="PeakPulse Korea Home"
        >
          <div className="w-8 h-8 rounded-lg bg-accent-subtle border border-accent-border flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
            <Mountain className="w-4 h-4" />
          </div>
          <span className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0">
            PeakPulse <span className="text-accent">Korea</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium text-slate-400" aria-label="Main Navigation">
          <button
            onClick={() => onSelectTab('summits')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 cursor-pointer ${
              activeTab === 'summits' ? 'text-accent font-semibold' : ''
            }`}
          >
            Mountain Summits
          </button>
          <button
            onClick={() => onSelectTab('progress')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'progress' ? 'text-accent font-semibold' : ''
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Busan & Korea Progress</span>
          </button>
          <button
            onClick={() => onSelectTab('running')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 cursor-pointer ${
              activeTab === 'running' ? 'text-accent font-semibold' : ''
            }`}
          >
            Running Logs
          </button>
          <button
            onClick={() => onSelectTab('stats')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 cursor-pointer ${
              activeTab === 'stats' ? 'text-accent font-semibold' : ''
            }`}
          >
            Analytics & PRs
          </button>
          <button
            onClick={() => onSelectTab('map')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 cursor-pointer ${
              activeTab === 'map' ? 'text-accent font-semibold' : ''
            }`}
          >
            Korea Peak Map
          </button>
          <button
            onClick={() => onSelectTab('photos')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 cursor-pointer ${
              activeTab === 'photos' ? 'text-accent font-semibold' : ''
            }`}
          >
            Photo Archive
          </button>
        </nav>

        {/* Zone 3: Actions + Theme Selector + Admin Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Theme Palette Switcher */}
          <ThemeSelector />

          {isAdmin ? (
            <>
              {/* Admin Active Tag */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent-subtle border border-accent-border text-accent text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </div>


              <button
                onClick={onOpenSecurityModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-accent bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Security & Passkey settings"
              >
                <KeyRound className="w-3.5 h-3.5 text-accent" />
                <span>Passkey</span>
              </button>

              <button
                onClick={onOpenLogModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-accent hover:bg-accent-hover active:scale-[0.98] transition-all rounded-lg shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
                aria-label="Log new outdoor activity"
              >
                <Plus className="w-4 h-4" />
                <span>+ Log Ascent</span>
              </button>

              <button
                onClick={onLogoutAdmin}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent hover:text-accent-hover bg-slate-900 hover:bg-slate-850 border border-accent-border rounded-lg transition-all whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
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
      <div className="md:hidden flex items-center justify-between border-t border-slate-800/80 px-2 sm:px-3 py-1.5 text-xs font-medium text-slate-400 gap-1 overflow-x-auto no-scrollbar w-full max-w-full">
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onSelectTab('summits')}
            className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'summits' ? 'text-accent font-semibold bg-slate-900' : 'hover:text-slate-200'
            }`}
          >
            Summits
          </button>
          <button
            onClick={() => onSelectTab('progress')}
            className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'progress' ? 'text-accent font-semibold bg-slate-900' : 'hover:text-slate-200'
            }`}
          >
            Progress
          </button>
          <button
            onClick={() => onSelectTab('running')}
            className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'running' ? 'text-accent font-semibold bg-slate-900' : 'hover:text-slate-200'
            }`}
          >
            Running
          </button>
          <button
            onClick={() => onSelectTab('stats')}
            className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'stats' ? 'text-accent font-semibold bg-slate-900' : 'hover:text-slate-200'
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => onSelectTab('map')}
            className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'map' ? 'text-accent font-semibold bg-slate-900' : 'hover:text-slate-200'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => onSelectTab('photos')}
            className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'photos' ? 'text-accent font-semibold bg-slate-900' : 'hover:text-slate-200'
            }`}
          >
            Photos
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {isAdmin ? (
            <button
              onClick={onOpenLogModal}
              className="px-2.5 py-1 text-xs font-bold bg-accent rounded-lg cursor-pointer shrink-0 shadow-sm"
            >
              + Log
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="px-2 py-1 text-[11px] font-semibold text-accent border border-accent-border rounded-lg cursor-pointer shrink-0 bg-slate-900"
            >
              Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
