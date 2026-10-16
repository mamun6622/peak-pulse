import React, { useState, useEffect, useMemo } from 'react';
import { Activity, MountainSummary, PhotoItem, SummitLog, RunningLog } from './types/activity';
import { loadActivities, initStorage, addActivity, updateActivity, deleteActivity, saveActivities } from './services/storageService';
import {
  subscribeToFirestoreActivities,
  saveActivityToFirestore,
  deleteActivityFromFirestore,
  syncAllActivitiesToFirestore,
} from './services/firebaseFirestoreService';
import { subscribeToAuthChanges, logoutFirebase, auth } from './services/firebase';
import {
  calculateMountainSummaries,
  calculateMonthlyStats,
  calculatePersonalRecords,
} from './utils/activityStats';
import { calculateProgression } from './utils/progressionSystem';
import { KOREA_ALL_MOUNTAINS, KoreaMountain } from './data/koreaMountainsDatabase';

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
import { KoreaMountainProgress } from './components/KoreaMountainProgress';
import { Mountain, ShieldCheck, CheckCircle2, AlertCircle, Flame, Trash2 } from 'lucide-react';

export default function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'summits' | 'progress' | 'running' | 'stats' | 'map' | 'photos'>('summits');

  // Role / Auth State: viewer by default, owner can unlock admin mode
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('peakpulse_is_admin') === 'true';
  });
  const [firebaseUserEmail, setFirebaseUserEmail] = useState<string | null>(auth.currentUser?.email || null);

  // Modals state
  const [selectedMountainId, setSelectedMountainId] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [preselectedMountainForLog, setPreselectedMountainForLog] = useState<MountainSummary | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);
  const [isKoreaDirectoryOpen, setIsKoreaDirectoryOpen] = useState<boolean>(false);
  const [activityPendingDelete, setActivityPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [lightboxData, setLightboxData] = useState<{
    photo: PhotoItem;
    title: string;
    subtitle: string;
  } | null>(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((current) => (current?.text === text ? null : current));
    }, 4000);
  };

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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubAuth = subscribeToAuthChanges((user) => {
      setFirebaseUserEmail(user?.email || null);
      if (user) {
        setIsAdmin(true);
        sessionStorage.setItem('peakpulse_is_admin', 'true');
        // Once signed in with Google, push any local activities to Firestore
        const local = loadActivities();
        if (local && local.length > 0) {
          syncAllActivitiesToFirestore(local).catch(() => {});
        }
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time Firestore Cloud activities sync
  useEffect(() => {
    const unsubFirestore = subscribeToFirestoreActivities(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length > 0) {
          setActivities(firestoreItems);
          saveActivities(firestoreItems);
        }
      },
      (err) => {
        console.warn('Real-time Firestore subscription note:', err);
      }
    );
    return () => {
      if (unsubFirestore) unsubFirestore();
    };
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
    showToast('Admin mode activated! Full access to add, edit, and delete activities.');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('peakpulse_is_admin');
    logoutFirebase().catch(() => {});
    showToast('Switched to public viewer mode.', 'info');
  };

  // Activity Handlers: Save (Create or Edit)
  const handleSaveActivity = async (savedAct: Activity) => {
    if (editingActivity) {
      // Edit mode
      const updated = updateActivity(savedAct);
      setActivities(updated);
      setEditingActivity(null);

      try {
        await saveActivityToFirestore(savedAct);
        showToast('Activity changes saved and synchronized to Cloud Firestore!');
      } catch (err: any) {
        console.warn('Firestore update note:', err);
        showToast('Saved locally. Sign in with Google to sync with cloud database.', 'info');
      }
    } else {
      // Create mode
      const updated = addActivity(savedAct);
      setActivities(updated);

      try {
        await saveActivityToFirestore(savedAct);
        showToast('Activity and photos saved directly to Cloud Firestore!');
      } catch (err: any) {
        console.warn('Firestore create note:', err);
        showToast('Saved locally. Sign in with Google to sync with cloud database.', 'info');
      }
    }
  };

  // Edit Activity Trigger
  const handleStartEditActivity = (act: Activity) => {
    if (!isAdmin) {
      showToast('Admin authentication required. Please sign in with Google or Owner Passkey.', 'error');
      setIsAdminAuthOpen(true);
      return;
    }
    setEditingActivity(act);
    setPreselectedMountainForLog(null);
    setIsLogModalOpen(true);
  };

  // Delete Activity Handlers (Native UI without window.confirm)
  const promptDeleteActivity = (id: string, name?: string) => {
    if (!isAdmin) {
      showToast('Admin authentication required. Please sign in with Google or Owner Passkey.', 'error');
      setIsAdminAuthOpen(true);
      return;
    }
    const act = activities.find((a) => a.id === id);
    const title =
      name ||
      (act?.activityType === 'summit'
        ? `${act.mountainName} (${act.peakName} · Summit #${act.summitNumber})`
        : (act as RunningLog)?.title) ||
      'this activity';
    setActivityPendingDelete({ id, name: title });
  };

  const executeDeleteActivity = async () => {
    if (!activityPendingDelete) return;
    const { id } = activityPendingDelete;
    setActivityPendingDelete(null);

    // 1. Immediately delete from local storage & memory cache
    const updated = deleteActivity(id);
    setActivities(updated);

    // 2. Delete from Firestore cloud database asynchronously
    try {
      await deleteActivityFromFirestore(id);
      showToast('Activity successfully deleted from journal and Cloud Firestore database!', 'success');
    } catch (err) {
      console.warn('Deleted locally, Firestore note:', err);
      showToast('Activity deleted from journal.', 'info');
    }

    // 3. If MountainDetailModal is currently open, check if this mountain still has remaining summits
    if (selectedMountainId) {
      const remainingSummits = updated.filter(
        (a): a is SummitLog => a.activityType === 'summit'
      );
      const summaries = calculateMountainSummaries(remainingSummits);
      const stillHasSummits = summaries.some((s) => s.mountainId === selectedMountainId);
      if (!stillHasSummits) {
        setSelectedMountainId(null);
      }
    }
  };

  // Set Mountain Cover Photo Handler
  const handleSetCoverPhoto = async (photoId: string, summitId: string) => {
    if (!isAdmin) {
      showToast('Admin authentication required to set cover photo.', 'error');
      return;
    }

    const targetSummit = activities.find((a) => a.id === summitId) as SummitLog | undefined;
    if (!targetSummit || targetSummit.activityType !== 'summit') return;

    const mId = targetSummit.mountainId;
    const mName = targetSummit.mountainName.toLowerCase().trim();

    // Mark the selected photo as isCover: true, and unmark all others for this mountain
    const updated = activities.map((act) => {
      if (
        act.activityType === 'summit' &&
        (act.mountainId === mId || act.mountainName.toLowerCase().trim() === mName)
      ) {
        const updatedPhotos = (act.photos || []).map((p) => ({
          ...p,
          isCover: p.id === photoId,
        }));
        return {
          ...act,
          photos: updatedPhotos,
        };
      }
      return act;
    });

    setActivities(updated);
    saveActivities(updated);

    try {
      const mountainSummits = updated.filter(
        (a): a is SummitLog =>
          a.activityType === 'summit' &&
          (a.mountainId === mId || a.mountainName.toLowerCase().trim() === mName)
      );
      for (const s of mountainSummits) {
        await saveActivityToFirestore(s);
      }
      showToast(`Cover thumbnail updated for ${targetSummit.mountainName}!`, 'success');
    } catch (err) {
      console.warn('Cover photo Firestore sync note:', err);
      showToast(`Cover thumbnail updated for ${targetSummit.mountainName}!`, 'info');
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
    setEditingActivity(null);
    setPreselectedMountainForLog(m);
    setIsLogModalOpen(true);
  };

  const handleOpenGeneralLogModal = () => {
    if (!isAdmin) {
      setIsAdminAuthOpen(true);
      return;
    }
    setEditingActivity(null);
    setPreselectedMountainForLog(null);
    setIsLogModalOpen(true);
  };

  const handleSelectPhoto = (photo: PhotoItem, title: string, subtitle: string) => {
    setLightboxData({ photo, title, subtitle });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 max-w-sm p-3.5 rounded-xl bg-stone-900 border border-stone-700 shadow-2xl flex items-center gap-2.5 text-xs text-stone-200 animate-in fade-in slide-in-from-top-4 duration-300">
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toastMsg.type === 'info' ? (
            <Flame className="w-4 h-4 text-orange-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isAdmin={isAdmin}
        firebaseUserEmail={firebaseUserEmail}
        onOpenLogModal={handleOpenGeneralLogModal}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenAdminLogin={() => setIsAdminAuthOpen(true)}
        onLogoutAdmin={handleLogout}
        onOpenSecurityModal={() => setIsAdminAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section - Only on Mountain Summits view */}
        {activeTab === 'summits' && (
          <HeroOverview
            activeTab={activeTab}
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
        )}

        {/* Progression & Achievement HUD System - Only on Mountain Summits view */}
        {activeTab === 'summits' && (
          <ProgressionHUD
            stats={progressionStats}
            totalKoreaMountainsCount={KOREA_ALL_MOUNTAINS.length}
            uniqueSummitedCount={mountainSummaries.length}
          />
        )}

        {/* TAB 1: Mountain Summits */}
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
              onEditActivity={handleStartEditActivity}
              onDeleteActivity={promptDeleteActivity}
              initialFilter="summit"
            />
          </>
        )}

        {/* TAB 2: Busan & Korea Mountain Progress Tracker */}
        {activeTab === 'progress' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <KoreaMountainProgress
              activities={activities}
              mountainSummaries={mountainSummaries}
              onSelectMountain={handleSelectMountain}
              onLogAscentForMountain={(mountain: KoreaMountain) => {
                if (!isAdmin) {
                  setIsAdminAuthOpen(true);
                  return;
                }
                const summary = mountainSummaries.find((s) => s.mountainId === mountain.id);
                setEditingActivity(null);
                setPreselectedMountainForLog(summary || null);
                setIsLogModalOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 3: Running Logs */}
        {activeTab === 'running' && (
          <ActivityTimeline
            activities={activities}
            isAdmin={isAdmin}
            onSelectPhoto={handleSelectPhoto}
            onSelectMountain={handleSelectMountain}
            onEditActivity={handleStartEditActivity}
            onDeleteActivity={promptDeleteActivity}
            initialFilter="running"
          />
        )}

        {/* TAB 4: Analytics & PRs */}
        {activeTab === 'stats' && (
          <MonthlyStatsDashboard
            monthlyStats={monthlyStats}
            records={personalRecords}
            activities={activities}
          />
        )}

        {/* TAB 5: Korea Peak Map */}
        {activeTab === 'map' && (
          <InteractiveKoreaMap
            mountains={mountainSummaries}
            onSelectMountain={handleSelectMountain}
          />
        )}

        {/* TAB 6: Photo Archive */}
        {activeTab === 'photos' && (
          <PhotoArchiveGallery
            activities={activities}
            onSelectPhoto={handleSelectPhoto}
          />
        )}
      </main>

      {/* MODALS */}

      {/* Delete Confirmation Modal (Native UI without window.confirm) */}
      {activityPendingDelete && (
        <div
          className="fixed inset-0 z-[70] bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-950/40">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-stone-100 mb-1">
              Delete Ascent Log?
            </h3>
            <p className="text-amber-400 font-semibold text-sm mb-3">
              "{activityPendingDelete.name}"
            </p>

            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed mb-6">
              Are you sure you want to permanently delete this log? This will recalculate your summit counts, update your stats, and remove the entry from Cloud Firestore.
            </p>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setActivityPendingDelete(null)}
                className="flex-1 py-2.5 px-4 bg-stone-800 hover:bg-stone-750 text-stone-300 font-medium rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteActivity}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mountain Detail Modal with Repeat Ascents & Edit/Delete */}
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
          onEditSummit={(summit: SummitLog) => {
            setSelectedMountainId(null);
            handleStartEditActivity(summit);
          }}
          onDeleteSummit={(id: string) => {
            promptDeleteActivity(id);
          }}
          onSetCoverPhoto={handleSetCoverPhoto}
        />
      )}

      {/* Log / Edit Activity Modal */}
      {isLogModalOpen && (
        <LogActivityModal
          mountains={mountainSummaries}
          preselectedMountain={preselectedMountainForLog}
          initialActivity={editingActivity}
          onClose={() => {
            setIsLogModalOpen(false);
            setPreselectedMountainForLog(null);
            setEditingActivity(null);
          }}
          onSave={handleSaveActivity}
        />
      )}

      {/* Photo Lightbox */}
      {lightboxData && (
        <PhotoLightbox
          photo={lightboxData.photo}
          title={lightboxData.title}
          subtitle={lightboxData.subtitle}
          onClose={() => setLightboxData(null)}
        />
      )}

      {/* Data Management & Cloud Sync Modal */}
      {isDataModalOpen && (
        <DataManagementModal
          activities={activities}
          onClose={() => setIsDataModalOpen(false)}
          onDataChanged={(updated) => {
            setActivities(updated);
            saveActivities(updated);
          }}
        />
      )}

      {/* Admin Authentication & Firebase Security Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        isAdmin={isAdmin}
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
            <span>Busan & South Korea 🇰🇷</span>
            <span>·</span>
            <span className="text-orange-400/90 inline-flex items-center gap-1">
              <Flame className="w-3 h-3" />
              <span>Cloud Firestore Active</span>
            </span>
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
