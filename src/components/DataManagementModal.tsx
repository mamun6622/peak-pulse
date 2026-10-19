import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, AlertTriangle, CheckCircle2, Sparkles, Trash2, Flame, CloudUpload } from 'lucide-react';
import { Activity } from '../types/activity';
import { exportActivitiesToJson, importActivitiesFromJson, loadSampleSeedData, clearAllActivities } from '../services/storageService';
import { syncAllActivitiesToFirestore } from '../services/firebaseFirestoreService';
import { auth, loginWithGoogle } from '../services/firebase';

interface DataManagementModalProps {
  activities: Activity[];
  onClose: () => void;
  onDataChanged: (updated: Activity[]) => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  activities,
  onClose,
  onDataChanged,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<string>('');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSyncToFirebase = async () => {
    if (!auth.currentUser) {
      try {
        setStatusMsg({ text: 'Connecting to Google Firebase Auth...', type: 'info' });
        await loginWithGoogle();
      } catch (err: any) {
        setStatusMsg({ text: 'Please sign in with Google to sync with Cloud Firestore.', type: 'error' });
        return;
      }
    }

    if (activities.length === 0) {
      setStatusMsg({ text: 'No activities to sync. Add an ascent first!', type: 'info' });
      return;
    }

    setIsSyncingCloud(true);
    setStatusMsg({ text: `Syncing ${activities.length} activities & photos to Cloud Firestore...`, type: 'info' });

    try {
      const result = await syncAllActivitiesToFirestore(activities, (current, total) => {
        setSyncProgress(`Uploading activity ${current} of ${total} to Firestore...`);
      });

      if (result.failed === 0) {
        setStatusMsg({
          text: `Success! All ${result.success} activities and photos saved to Firebase Firestore Cloud!`,
          type: 'success',
        });
      } else {
        setStatusMsg({
          text: `Synced ${result.success} activities (${result.failed} failed). Check connection.`,
          type: 'error',
        });
      }
    } catch (err: any) {
      setStatusMsg({ text: err?.message || 'Cloud sync encountered an error.', type: 'error' });
    } finally {
      setIsSyncingCloud(false);
      setSyncProgress('');
    }
  };

  const handleExport = () => {
    exportActivitiesToJson(activities);
    setStatusMsg({ text: 'Backup downloaded successfully as JSON file.', type: 'success' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importActivitiesFromJson(text);
        onDataChanged(imported);
        setStatusMsg({ text: `Imported ${imported.length} activities successfully!`, type: 'success' });
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to import JSON file.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    const sample = loadSampleSeedData();
    onDataChanged(sample);
    setStatusMsg({ text: `Loaded ${sample.length} sample Korea mountain & running logs!`, type: 'success' });
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all activities and start with a fresh clean slate?')) {
      const empty = clearAllActivities();
      onDataChanged(empty);
      setStatusMsg({ text: 'Cleared all activities. Starting fresh!', type: 'success' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-5">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-stone-100">Data Management & Cloud Sync</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
              <Flame className="w-3 h-3" /> Firebase
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : statusMsg.type === 'info'
                ? 'bg-accent-subtle border border-accent-border text-accent'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-accent" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Cloud Sync to Firebase */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-accent-subtle to-transparent border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <CloudUpload className="w-4 h-4 text-orange-400" />
                <span>Save All Data to Firebase Cloud</span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Upload and persist all {activities.length} activity records & photos directly to Cloud Firestore.
              </div>
              {syncProgress && (
                <div className="text-[11px] text-orange-300 font-mono mt-1 animate-pulse">
                  {syncProgress}
                </div>
              )}
            </div>
            <button
              onClick={handleSyncToFirebase}
              disabled={isSyncingCloud}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isSyncingCloud ? 'Syncing to Cloud...' : 'Sync to Database'}</span>
            </button>
          </div>

          {/* Export */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-200">Export Backup</div>
              <div className="text-xs text-slate-400">
                Download all {activities.length} activity records & photos as JSON
              </div>
            </div>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-semibold bg-accent hover:bg-accent-hover text-slate-950 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-200">Import Backup</div>
              <div className="text-xs text-slate-400">Restore from an exported JSON backup file</div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Load Sample Starter Data */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-200">Load Starter Korean Summits</div>
              <div className="text-xs text-slate-400">Load Geumjeongsan, Bukhansan, and trail runs</div>
            </div>
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 text-xs font-semibold bg-accent hover:bg-accent-hover text-slate-950 rounded-lg inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Starter</span>
            </button>
          </div>

          {/* Clear All Data */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-rose-300">Clear All Activities</div>
              <div className="text-xs text-stone-400">Wipe all logs to start with a pristine clean slate</div>
            </div>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900 border border-rose-900/50 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
