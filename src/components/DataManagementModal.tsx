import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, AlertTriangle, CheckCircle2, Sparkles, Trash2 } from 'lucide-react';
import { Activity } from '../types/activity';
import { exportActivitiesToJson, importActivitiesFromJson, loadSampleSeedData, clearAllActivities } from '../services/storageService';

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
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-5">
          <h3 className="text-lg font-bold text-stone-100">Data Management & Backup</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Export */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-stone-200">Export Backup</div>
              <div className="text-xs text-stone-400">
                Download all {activities.length} activity records & photos as JSON
              </div>
            </div>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-stone-200">Import Backup</div>
              <div className="text-xs text-stone-400">Restore from an exported JSON backup file</div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg inline-flex items-center gap-1.5"
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

          {/* Load Sample Demo Data */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-stone-200">Load Starter Korean Summits</div>
              <div className="text-xs text-stone-400">Load Bukhansan (14x), Inwangsan (11x), and Han River runs</div>
            </div>
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg inline-flex items-center gap-1.5 shadow-sm"
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
              className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900 border border-rose-900/50 rounded-lg inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
