import React, { useState, useMemo } from 'react';
import { X, Mountain, Search, MapPin, CheckCircle, Plus, Compass, ArrowUpDown } from 'lucide-react';
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
  const [elevationFilter, setElevationFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all');
  const [sortOrder, setSortOrder] = useState<'elev-desc' | 'elev-asc' | 'name-asc'>('elev-desc');

  if (!isOpen) return null;

  const provinces = [
    'all',
    'Busan',
    'Seoul',
    'Gangwon',
    'Gyeonggi',
    'Chungcheong',
    'Jeolla',
    'Gyeongnam',
    'Gyeongbuk',
    'Ulsan',
    'Gimhae',
    'Geoje',
    'Jeju',
  ];

  const filteredMountains = useMemo(() => {
    const list = KOREA_ALL_MOUNTAINS.filter((m) => {
      if (selectedProvince !== 'all' && m.province !== selectedProvince) return false;

      if (elevationFilter === 'high' && m.elevationM < 1000) return false;
      if (elevationFilter === 'mid' && (m.elevationM < 500 || m.elevationM >= 1000)) return false;
      if (elevationFilter === 'low' && m.elevationM >= 500) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          m.name.toLowerCase().includes(q) ||
          m.koreanName.toLowerCase().includes(q) ||
          m.peakName.toLowerCase().includes(q) ||
          m.regionDetail.toLowerCase().includes(q) ||
          (m.famousBadge && m.famousBadge.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortOrder === 'elev-desc') return b.elevationM - a.elevationM;
      if (sortOrder === 'elev-asc') return a.elevationM - b.elevationM;
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  }, [selectedProvince, searchQuery, elevationFilter, sortOrder]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-accent mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Korea Master Mountain Directory</span>
              <span className="text-slate-600">·</span>
              <span>{KOREA_ALL_MOUNTAINS.length} Peaks Cataloged</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              Famous Mountains &amp; Local Peaks of South Korea
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Browse small neighborhood hills, coastal lookouts, and high alpine summits across all provinces.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 space-y-3">
          {/* Province selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-mono pb-1 max-w-full">
            {provinces.map((prov) => {
              const count =
                prov === 'all'
                  ? KOREA_ALL_MOUNTAINS.length
                  : KOREA_ALL_MOUNTAINS.filter((m) => m.province === prov).length;
              return (
                <button
                  key={prov}
                  onClick={() => setSelectedProvince(prov)}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                    selectedProvince === prov
                      ? 'bg-accent text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{prov === 'all' ? 'All Korea' : prov}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search bar & Elevation filter & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by mountain name, Korean hangul, or peak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Elevation filter */}
              <select
                value={elevationFilter}
                onChange={(e) => setElevationFilter(e.target.value as any)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="all">All Heights</option>
                <option value="low">Small &amp; Urban (&lt;500m)</option>
                <option value="mid">Mid Ridge (500–1000m)</option>
                <option value="high">High Alpine (&gt;1000m)</option>
              </select>

              {/* Sort order */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="elev-desc">Elevation (High → Low)</option>
                <option value="elev-asc">Elevation (Low → High)</option>
                <option value="name-asc">Name (A → Z)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>
              Showing <strong className="text-slate-200">{filteredMountains.length}</strong> peaks
              {selectedProvince !== 'all' ? ` in ${selectedProvince}` : ' across South Korea'}
            </span>
            {(selectedProvince !== 'all' || searchQuery || elevationFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedProvince('all');
                  setSearchQuery('');
                  setElevationFilter('all');
                }}
                className="text-accent hover:underline cursor-pointer text-xs"
              >
                Reset filters
              </button>
            )}
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
                    ? 'bg-slate-950/80 border-accent-border shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h4 className="text-base font-bold text-slate-100">
                          {m.name}
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">
                          {m.koreanName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {m.peakName} · {m.regionDetail}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold font-mono text-accent">
                        {m.elevationM}
                      </span>
                      <span className="text-xs text-slate-400 font-mono ml-0.5">m</span>
                    </div>
                  </div>

                  {m.famousBadge && (
                    <div className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 inline-block mb-3">
                      {m.famousBadge}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  {isSummited ? (
                    <button
                      onClick={() => {
                        onClose();
                        onViewMountainHistory(m.id);
                      }}
                      className="inline-flex items-center gap-1.5 text-accent font-mono font-semibold hover:underline cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{userRecord?.totalSummits} Summits Logged</span>
                    </button>
                  ) : (
                    <span className="text-slate-500 font-mono text-[11px]">
                      Not yet summited
                    </span>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        onClose();
                        onLogForMountain(m.id);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-accent hover:text-slate-950 text-slate-200 transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
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
