import React, { useState, useEffect, useMemo } from 'react';
import { Activity, MountainSummary, PhotoItem } from './types/activity';
import { loadActivities, initStorage, addActivity, deleteActivity } from './services/storageService';
import {
  calculateMountainSummaries,
  calculateMonthlyStats,
  calculatePersonalRecords,
} from './utils/activityStats';
import { calculateProgression } from './utils/progressionSystem';
import { KOREA_ALL_MOUNTAINS } from './data/koreaMountainsDatabase';

import { Navbar } from './components/Navbar';
import { HeroOverview } from './components/HeroOverview';
import { ProgressionHUD } from './components/ProgressionHUD';
import { HallOfPeaks } from './components/HallOfPeaks';
import { ActivityTimeline } from './components/ActivityTimeline';
import { MonthlyStatsDashboard } from './components/MonthlyStatsDashboard';
import { InteractiveKoreaMap } from './components/InteractiveKoreaMap';
import { PhotoArchiveGallery } from './components/PhotoArchiveGallery';
import { MountainDetailModal } from './components/MountainDetailModal';
import { LogActivityModal } from './components/LogActivityModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { DataManagementModal } from './components/DataManagementModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { KoreaMountainsModal } from './components/KoreaMountainsModal';
import { Mountain, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'summits' | 'running' | 'stats' | 'map' | 'photos'>('summits');

  // Role / Auth State: viewer by default, owner can unlock admin mode
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('peakpulse_is_admin') === 'true';
  });

  // Modals state
  const [selectedMountainId, setSelectedMountainId] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [preselectedMountainForLog, setPreselectedMountainForLog] = useState<MountainSummary | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);
  const [isKoreaDirectoryOpen, setIsKoreaDirectoryOpen] = useState<boolean>(false);
  const [lightboxData, setLightboxData] = useState<{
    photo: PhotoItem;
    title: string;
    subtitle: string;
  } | null>(null);

  // Load activities on mount with sync read & async IndexedDB reconciliation
  useEffect(() => {
    const syncLoaded = loadActivities();
    if (syncLoaded && syncLoaded.length > 0) {
      setActivities(syncLoaded);
    }
    initStorage().then((loaded) => {
      setActivities(loaded);
    });
  }, []);

  // Compute stats
  const mountainSummaries = useMemo(() => calculateMountainSummaries(activities), [activities]);
  const monthlyStats = useMemo(() => calculateMonthlyStats(activities), [activities]);
  const personalRecords = useMemo(() => calculatePersonalRecords(activities), [activities]);
  const progressionStats = useMemo(() => calculateProgression(activities), [activities]);

  const topMountain = mountainSummaries[0];

  const currentSelectedMountain = useMemo(() => {
    if (!selectedMountainId) return null;
    return mountainSummaries.find((m) => m.mountainId === selectedMountainId) || null;
  }, [selectedMountainId, mountainSummaries]);

  // Auth Handlers
  const handleLoginSuccess = () => {
    setIsAdmin(true);
    sessionStorage.setItem('peakpulse_is_admin', 'true');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('peakpulse_is_admin');
  };

  // Activity Handlers
  const handleSaveActivity = (newAct: Activity) => {
    const updated = addActivity(newAct);
    setActivities(updated);
  };

  const handleDeleteActivity = (id: string) => {
    if (!isAdmin) {
      setIsAdminAuthOpen(true);
      return;
    }
    if (window.confirm('Are you sure you want to delete this activity log?')) {
      const updated = deleteActivity(id);
      setActivities(updated);
    }
  };

  const handleSelectMountain = (id: string) => {
    setSelectedMountainId(id);
  };

  const handleQuickLogForMountain = (m: MountainSummary) => {
    if (!isAdmin) {
      setIsAdminAuthOpen(true);
      return;
    }
    setPreselectedMountainForLog(m);
    setIsLogModalOpen(true);
  };

  const handleOpenGeneralLogModal = () => {
    if (!isAdmin) {
      setIsAdminAuthOpen(true);
      return;
    }
    setPreselectedMountainForLog(null);
    setIsLogModalOpen(true);
  };

  const handleSelectPhoto = (photo: PhotoItem, title: string, subtitle: string) => {
    setLightboxData({ photo, title, subtitle });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isAdmin={isAdmin}
        onOpenLogModal={handleOpenGeneralLogModal}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenAdminLogin={() => setIsAdminAuthOpen(true)}
        onLogoutAdmin={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroOverview
          records={personalRecords}
          topMountain={topMountain}
          isAdmin={isAdmin}
          onSelectMountain={handleSelectMountain}
          onExploreSummits={() => {
            setActiveTab('summits');
            const el = document.getElementById('hall-of-peaks');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenLogModal={handleOpenGeneralLogModal}
          onOpenKoreaDirectory={() => setIsKoreaDirectoryOpen(true)}
        />

        {/* Progression & Achievement HUD System */}
        <ProgressionHUD
          stats={progressionStats}
          totalKoreaMountainsCount={KOREA_ALL_MOUNTAINS.length}
          uniqueSummitedCount={mountainSummaries.length}
        />

        {/* View Switching based on active tab */}
        {activeTab === 'summits' && (
          <>
            <HallOfPeaks
              mountains={mountainSummaries}
              isAdmin={isAdmin}
              onSelectMountain={handleSelectMountain}
              onQuickLogForMountain={handleQuickLogForMountain}
              onOpenKoreaDirectory={() => setIsKoreaDirectoryOpen(true)}
              onOpenLogModal={handleOpenGeneralLogModal}
            />
            <ActivityTimeline
              activities={activities}
              isAdmin={isAdmin}
              onSelectPhoto={handleSelectPhoto}
              onSelectMountain={handleSelectMountain}
              onDeleteActivity={handleDeleteActivity}
              initialFilter="summit"
            />
          </>
        )}

        {activeTab === 'running' && (
          <ActivityTimeline
            activities={activities}
            isAdmin={isAdmin}
            onSelectPhoto={handleSelectPhoto}
            onSelectMountain={handleSelectMountain}
            onDeleteActivity={handleDeleteActivity}
            initialFilter="running"
          />
        )}

        {activeTab === 'stats' && (
          <MonthlyStatsDashboard
            monthlyStats={monthlyStats}
            records={personalRecords}
            activities={activities}
          />
        )}

        {activeTab === 'map' && (
          <InteractiveKoreaMap
            mountains={mountainSummaries}
            onSelectMountain={handleSelectMountain}
          />
        )}

        {activeTab === 'photos' && (
          <PhotoArchiveGallery
            activities={activities}
            onSelectPhoto={handleSelectPhoto}
          />
        )}
      </main>

      {/* Modals */}
      {currentSelectedMountain && (
        <MountainDetailModal
          mountain={currentSelectedMountain}
          isAdmin={isAdmin}
          onClose={() => setSelectedMountainId(null)}
          onSelectPhoto={handleSelectPhoto}
          onLogNextSummit={(m) => {
            setSelectedMountainId(null);
            handleQuickLogForMountain(m);
          }}
        />
      )}

      {isLogModalOpen && (
        <LogActivityModal
          mountains={mountainSummaries}
          preselectedMountain={preselectedMountainForLog}
          onClose={() => {
            setIsLogModalOpen(false);
            setPreselectedMountainForLog(null);
          }}
          onSave={handleSaveActivity}
        />
      )}

      {lightboxData && (
        <PhotoLightbox
          photo={lightboxData.photo}
          title={lightboxData.title}
          subtitle={lightboxData.subtitle}
          onClose={() => setLightboxData(null)}
        />
      )}

      {isDataModalOpen && (
        <DataManagementModal
          activities={activities}
          onClose={() => setIsDataModalOpen(false)}
          onDataChanged={setActivities}
        />
      )}

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Korea Mountains Catalog Directory Modal */}
      <KoreaMountainsModal
        isOpen={isKoreaDirectoryOpen}
        onClose={() => setIsKoreaDirectoryOpen(false)}
        userMountains={mountainSummaries}
        isAdmin={isAdmin}
        onLogForMountain={(mId) => {
          setIsKoreaDirectoryOpen(false);
          const found = mountainSummaries.find((u) => u.mountainId === mId);
          if (found) {
            handleQuickLogForMountain(found);
          } else {
            handleOpenGeneralLogModal();
          }
        }}
        onViewMountainHistory={(mId) => {
          setIsKoreaDirectoryOpen(false);
          handleSelectMountain(mId);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-950 py-10 text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Mountain className="w-3 h-3" />
            </div>
            <span className="font-bold text-stone-200">PeakPulse Korea</span>
            <span className="text-stone-600">·</span>
            <span>Personal Mountaineering & Running Expedition Journal</span>
          </div>

          <div className="flex items-center gap-4 text-stone-500 font-mono">
            <span>Seoul, South Korea 🇰🇷</span>
            <span>·</span>
            {isAdmin ? (
              <span className="text-amber-400 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Mode</span>
              </span>
            ) : (
              <span>Viewer Mode</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
