import React, { useState } from 'react';
import { X, Mountain, Search, MapPin, CheckCircle, Plus, Compass } from 'lucide-react';
import { KOREA_ALL_MOUNTAINS, KoreaMountain } from '../data/koreaMountainsDatabase';
import { MountainSummary } from '../types/activity';

interface KoreaMountainsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userMountains: MountainSummary[];
  isAdmin: boolean;
  onLogForMountain: (mountainId: string) => void;
  onViewMountainHistory: (mountainId: string) => void;
}

export const KoreaMountainsModal: React.FC<KoreaMountainsModalProps> = ({
  isOpen,
  onClose,
  userMountains,
  isAdmin,
  onLogForMountain,
  onViewMountainHistory,
}) => {
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const provinces = ['all', 'Seoul', 'Gyeonggi', 'Gangwon', 'Chungcheong', 'Jeolla', 'Gyeongsang', 'Jeju'];

  const filteredMountains = KOREA_ALL_MOUNTAINS.filter((m) => {
    if (selectedProvince !== 'all' && m.province !== selectedProvince) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        m.name.toLowerCase().includes(q) ||
        m.koreanName.toLowerCase().includes(q) ||
        m.peakName.toLowerCase().includes(q) ||
        m.regionDetail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-800 bg-stone-950 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Korea Master Mountain Directory</span>
              <span className="text-stone-600">·</span>
              <span>{KOREA_ALL_MOUNTAINS.length} Peaks Cataloged</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-100">
              Famous Mountains of South Korea
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
              Browse peaks across all provinces, elevations, and track which mountains have been summited.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white bg-stone-900 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-stone-800 bg-stone-900/50 space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono pb-1">
            {provinces.map((prov) => (
              <button
                key={prov}
                onClick={() => setSelectedProvince(prov)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  selectedProvince === prov
                    ? 'bg-amber-400 text-stone-950 font-bold'
                    : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                {prov === 'all' ? 'All Korea' : prov}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by mountain name, Korean hangul, or peak name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Mountains Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMountains.map((m) => {
            const userRecord = userMountains.find(
              (u) => u.mountainId === m.id || u.mountainName.toLowerCase() === m.name.toLowerCase()
            );
            const isSummited = Boolean(userRecord && userRecord.totalSummits > 0);

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isSummited
                    ? 'bg-stone-950/80 border-amber-500/40 shadow-sm'
                    : 'bg-stone-950/40 border-stone-800/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h4 className="text-base font-bold text-stone-100">
                          {m.name}
                        </h4>
                        <span className="text-xs text-stone-400 font-medium">
                          {m.koreanName}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        {m.peakName} · {m.regionDetail}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold font-mono text-amber-400">
                        {m.elevationM}
                      </span>
                      <span className="text-xs text-stone-400 font-mono ml-0.5">m</span>
                    </div>
                  </div>

                  {m.famousBadge && (
                    <div className="text-[11px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-850 inline-block mb-3">
                      {m.famousBadge}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs">
                  {isSummited ? (
                    <button
                      onClick={() => {
                        onClose();
                        onViewMountainHistory(m.id);
                      }}
                      className="inline-flex items-center gap-1.5 text-amber-400 font-mono font-semibold hover:underline"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{userRecord?.totalSummits} Summits Logged</span>
                    </button>
                  ) : (
                    <span className="text-stone-500 font-mono text-[11px]">
                      Not yet summited
                    </span>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        onClose();
                        onLogForMountain(m.id);
                      }}
                      className="px-2.5 py-1 rounded bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-stone-200 transition-colors inline-flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Log Ascent</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
