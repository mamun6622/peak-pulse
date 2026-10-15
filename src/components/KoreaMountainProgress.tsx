import React, { useState, useMemo } from 'react';
import {
  Compass,
  CheckCircle2,
  Circle,
  Plus,
  MapPin,
  TrendingUp,
  Award,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Activity, SummitLog, MountainSummary } from '../types/activity';
import { KOREA_ALL_MOUNTAINS, KoreanProvince, KoreaMountain } from '../data/koreaMountainsDatabase';

interface KoreaMountainProgressProps {
  activities: Activity[];
  mountainSummaries: MountainSummary[];
  onSelectMountain: (mountainId: string) => void;
  onLogAscentForMountain: (mountain: KoreaMountain) => void;
}

const PROVINCE_CONFIG: {
  key: KoreanProvince;
  label: string;
  koreanLabel: string;
  icon: string;
  accentColor: string;
  bgLight: string;
}[] = [
  { key: 'Busan', label: 'Busan', koreanLabel: '부산광역시', icon: '🌊', accentColor: 'text-sky-400', bgLight: 'bg-sky-500/10' },
  { key: 'Seoul', label: 'Seoul Capital Area', koreanLabel: '서울특별시', icon: '🏙️', accentColor: 'text-amber-400', bgLight: 'bg-amber-500/10' },
  { key: 'Gangwon', label: 'Gangwon-do', koreanLabel: '강원도', icon: '🌲', accentColor: 'text-emerald-400', bgLight: 'bg-emerald-500/10' },
  { key: 'Gyeonggi', label: 'Gyeonggi-do', koreanLabel: '경기도', icon: '🌾', accentColor: 'text-teal-400', bgLight: 'bg-teal-500/10' },
  { key: 'Chungcheong', label: 'Chungcheong-do', koreanLabel: '충청도', icon: '🍁', accentColor: 'text-orange-400', bgLight: 'bg-orange-500/10' },
  { key: 'Jeolla', label: 'Jeolla-do', koreanLabel: '전라도', icon: '⛰️', accentColor: 'text-rose-400', bgLight: 'bg-rose-500/10' },
  { key: 'Gyeongsang', label: 'Gyeongsang-do', koreanLabel: '경상도', icon: '🏞️', accentColor: 'text-indigo-400', bgLight: 'bg-indigo-500/10' },
  { key: 'Jeju', label: 'Jeju Island', koreanLabel: '제주특별자치도', icon: '🌋', accentColor: 'text-fuchsia-400', bgLight: 'bg-fuchsia-500/10' },
];

export const KoreaMountainProgress: React.FC<KoreaMountainProgressProps> = ({
  activities,
  mountainSummaries,
  onSelectMountain,
  onLogAscentForMountain,
}) => {
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'visited' | 'unvisited'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract all summit logs
  const summitLogs = useMemo(() => {
    return activities.filter((a): a is SummitLog => a.activityType === 'summit');
  }, [activities]);

  // Map of visited mountains with count and latest date
  const visitedMountainsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        count: number;
        latestDate: string;
        totalElevGain: number;
        summaryId?: string;
      }
    >();

    summitLogs.forEach((summit) => {
      const matchName = summit.mountainName.toLowerCase().trim();
      const matchId = summit.mountainId?.toLowerCase().trim();

      // Find matching mountain in KOREA_ALL_MOUNTAINS
      const target = KOREA_ALL_MOUNTAINS.find(
        (m) =>
          m.id === matchId ||
          m.name.toLowerCase().trim() === matchName ||
          summit.koreanName.includes(m.name)
      );

      const targetId = target ? target.id : (summit.mountainId || matchName);

      const existing = map.get(targetId);
      if (existing) {
        existing.count += 1;
        if (summit.date > existing.latestDate) {
          existing.latestDate = summit.date;
        }
        existing.totalElevGain += summit.elevationGainM || 0;
      } else {
        map.set(targetId, {
          count: 1,
          latestDate: summit.date,
          totalElevGain: summit.elevationGainM || 0,
          summaryId: summit.mountainId,
        });
      }
    });

    return map;
  }, [summitLogs]);

  // Calculate stats by province
  const provinceStats = useMemo(() => {
    return PROVINCE_CONFIG.map((prov) => {
      const mountainsInProv = KOREA_ALL_MOUNTAINS.filter((m) => m.province === prov.key);
      const totalInProv = mountainsInProv.length;
      let visitedInProv = 0;
      let totalAscentsInProv = 0;

      mountainsInProv.forEach((m) => {
        const visitedInfo = visitedMountainsMap.get(m.id);
        if (visitedInfo && visitedInfo.count > 0) {
          visitedInProv += 1;
          totalAscentsInProv += visitedInfo.count;
        }
      });

      const percentage = totalInProv > 0 ? Math.round((visitedInProv / totalInProv) * 100) : 0;

      return {
        ...prov,
        total: totalInProv,
        visited: visitedInProv,
        totalAscents: totalAscentsInProv,
        percentage,
        mountains: mountainsInProv,
      };
    });
  }, [visitedMountainsMap]);

  // Overall National Korea Stats
  const nationalStats = useMemo(() => {
    const totalMountains = KOREA_ALL_MOUNTAINS.length;
    let visitedCount = 0;
    let totalAscents = 0;

    KOREA_ALL_MOUNTAINS.forEach((m) => {
      const visitedInfo = visitedMountainsMap.get(m.id);
      if (visitedInfo && visitedInfo.count > 0) {
        visitedCount += 1;
        totalAscents += visitedInfo.count;
      }
    });

    const percent = totalMountains > 0 ? Math.round((visitedCount / totalMountains) * 100) : 0;
    return {
      total: totalMountains,
      visited: visitedCount,
      totalAscents,
      percentage: percent,
    };
  }, [visitedMountainsMap]);

  // Busan-specific stats
  const busanStats = useMemo(() => {
    return provinceStats.find((p) => p.key === 'Busan') || {
      key: 'Busan',
      label: 'Busan',
      koreanLabel: '부산광역시',
      total: 18,
      visited: 0,
      totalAscents: 0,
      percentage: 0,
    };
  }, [provinceStats]);

  // Filtered mountains list for the interactive checklist
  const filteredMountains = useMemo(() => {
    return KOREA_ALL_MOUNTAINS.filter((m) => {
      // Province filter
      if (selectedProvinceFilter !== 'all' && m.province !== selectedProvinceFilter) {
        return false;
      }

      const isVisited = visitedMountainsMap.has(m.id);

      // Completion status filter
      if (completionFilter === 'visited' && !isVisited) return false;
      if (completionFilter === 'unvisited' && isVisited) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          m.name.toLowerCase().includes(q) ||
          m.koreanName.toLowerCase().includes(q) ||
          m.peakName.toLowerCase().includes(q) ||
          m.regionDetail.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [selectedProvinceFilter, completionFilter, searchQuery, visitedMountainsMap]);

  return (
    <div className="py-8 space-y-8">
      {/* SECTION 1: High Level Progress Heroes (Busan & Full Korea) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Busan Progress Hero Card */}
        <div className="relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-950 border border-sky-500/30 overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  <span>🌊</span>
                  <span>Busan Metropolitan Area (부산광역시)</span>
                </span>
                <span className="font-mono text-xs text-sky-400 font-bold">
                  {busanStats.percentage}% Complete
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-stone-100 mt-3">
                Busan Mountain Exploration
              </h3>
              <p className="text-xs sm:text-sm text-stone-400 mt-1">
                From Geumjeongsan fortress ridges to coastal Haeundae Jangsan and Yeongdo Bongnaesan.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-300 font-semibold">
                  {busanStats.visited} of {busanStats.total} Busan Peaks Bagged
                </span>
                <span className="text-stone-400">
                  {busanStats.totalAscents} total recorded ascents
                </span>
              </div>
              <div className="w-full h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, busanStats.percentage)}%` }}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-stone-800/80">
              <button
                onClick={() => {
                  setSelectedProvinceFilter('Busan');
                  setCompletionFilter('all');
                }}
                className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Filter Busan Checklist below</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-stone-500 font-mono text-[11px]">
                18 cataloged coastal & fortress peaks
              </span>
            </div>
          </div>
        </div>

        {/* Full Korea National Challenge Card */}
        <div className="relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-950 border border-amber-500/30 overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <span>⛰️</span>
                  <span>National Korea Alps (대한민국 명산)</span>
                </span>
                <span className="font-mono text-xs text-amber-400 font-bold">
                  {nationalStats.percentage}% Complete
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-stone-100 mt-3">
                Full Korea Grand Traverse
              </h3>
              <p className="text-xs sm:text-sm text-stone-400 mt-1">
                Tracking peaks bagged across all 8 Korean provinces, from Bukhansan and Seoraksan to Hallasan.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-300 font-semibold">
                  {nationalStats.visited} of {nationalStats.total} Korea Peaks Bagged
                </span>
                <span className="text-stone-400">
                  {nationalStats.totalAscents} total summits
                </span>
              </div>
              <div className="w-full h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, nationalStats.percentage)}%` }}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-stone-800/80">
              <button
                onClick={() => {
                  setSelectedProvinceFilter('all');
                  setCompletionFilter('all');
                }}
                className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Full National Directory</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-stone-500 font-mono text-[11px]">
                56 total Korean peaks cataloged
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Province Grid Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Regional Completion by Province & Metropolitan City</span>
            </h4>
            <p className="text-xs text-stone-400">
              Click any region to filter and inspect visited summits vs unvisited trails
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {provinceStats.map((prov) => {
            const isSelected = selectedProvinceFilter === prov.key;
            return (
              <button
                key={prov.key}
                onClick={() => {
                  if (isSelected) {
                    setSelectedProvinceFilter('all');
                  } else {
                    setSelectedProvinceFilter(prov.key);
                  }
                }}
                className={`p-3.5 sm:p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-850 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-stone-900/90 border-stone-800 hover:border-stone-700 hover:bg-stone-850'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{prov.icon}</span>
                  <span className={`text-xs font-mono font-bold ${prov.accentColor}`}>
                    {prov.percentage}%
                  </span>
                </div>
                <h5 className="text-xs sm:text-sm font-bold text-stone-200 truncate">
                  {prov.label}
                </h5>
                <p className="text-[11px] text-stone-400 font-sans">{prov.koreanLabel}</p>

                <div className="mt-2.5 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono text-stone-400">
                  <span>
                    <strong className="text-stone-200">{prov.visited}</strong> / {prov.total} peaks
                  </span>
                  <span>{prov.totalAscents} logs</span>
                </div>

                <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden mt-2 border border-stone-800/60">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      prov.percentage > 0 ? 'bg-amber-400' : 'bg-stone-800'
                    }`}
                    style={{ width: `${Math.max(prov.percentage > 0 ? 5 : 0, prov.percentage)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Interactive Mountains Progress Checklist & Explorer */}
      <div className="p-5 sm:p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>
                {selectedProvinceFilter === 'all'
                  ? 'All Korea Mountains Checklist'
                  : `${selectedProvinceFilter} Mountain Checklist`}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                {filteredMountains.length} peaks
              </span>
            </h4>
            <p className="text-xs text-stone-400 mt-0.5">
              Track climbed peaks with verified logs or quickly launch a log for your next ascent
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search peak, city or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/80">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 text-xs font-medium bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setCompletionFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                completionFilter === 'all'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All Peaks
            </button>
            <button
              onClick={() => setCompletionFilter('visited')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                completionFilter === 'visited'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Summited ({nationalStats.visited})</span>
            </button>
            <button
              onClick={() => setCompletionFilter('unvisited')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                completionFilter === 'unvisited'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Circle className="w-3.5 h-3.5 text-stone-500" />
              <span>Pending ({nationalStats.total - nationalStats.visited})</span>
            </button>
          </div>

          {/* Active province indicator / reset */}
          {selectedProvinceFilter !== 'all' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-400">Filtering by:</span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                {selectedProvinceFilter}
              </span>
              <button
                onClick={() => setSelectedProvinceFilter('all')}
                className="text-stone-500 hover:text-stone-300 underline cursor-pointer text-xs"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* Mountains Grid */}
        {filteredMountains.length === 0 ? (
          <div className="py-12 text-center text-stone-500 text-xs">
            No mountains found matching your filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredMountains.map((mountain) => {
              const visitedInfo = visitedMountainsMap.get(mountain.id);
              const isVisited = Boolean(visitedInfo && visitedInfo.count > 0);

              return (
                <div
                  key={mountain.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isVisited
                      ? 'bg-stone-950/80 border-emerald-500/30 hover:border-emerald-500/60'
                      : 'bg-stone-950/40 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-stone-100">
                          {mountain.name}
                        </span>
                        <span className="text-xs text-stone-400 font-sans">
                          {mountain.koreanName}
                        </span>
                      </div>
                      <p className="text-xs text-amber-400/90 font-mono mt-0.5">
                        {mountain.peakName}
                      </p>
                    </div>

                    {/* Status Badge */}
                    {isVisited ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{visitedInfo?.count}x</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-stone-900 text-stone-400 border border-stone-800 shrink-0">
                        <Circle className="w-3 h-3 text-stone-600" />
                        <span>Unclimbed</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-stone-400 mb-3">
                    <span className="px-1.5 py-0.5 rounded bg-stone-900 text-stone-300 font-mono">
                      {mountain.elevationM}m
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-stone-900 text-stone-300">
                      {mountain.province}
                    </span>
                    <span className="truncate">{mountain.regionDetail}</span>
                  </div>

                  {mountain.famousBadge && (
                    <div className="text-[10px] text-stone-400 line-clamp-1 mb-3 italic">
                      ★ {mountain.famousBadge}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-xs">
                    {isVisited ? (
                      <>
                        <button
                          onClick={() => onSelectMountain(mountain.id)}
                          className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 cursor-pointer text-xs"
                        >
                          <span>Ascent Logs</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onLogAscentForMountain(mountain)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Log Repeat</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] text-stone-500 font-mono">
                          Goal: {mountain.elevationM}m
                        </span>
                        <button
                          onClick={() => onLogAscentForMountain(mountain)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Bag Peak</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
