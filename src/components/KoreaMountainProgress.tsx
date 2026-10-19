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
  X,
  ArrowUpDown,
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
  { key: 'Seoul', label: 'Seoul', koreanLabel: '서울특별시', icon: '🏙️', accentColor: 'text-indigo-400', bgLight: 'bg-indigo-500/10' },
  { key: 'Gangwon', label: 'Gangwon-do', koreanLabel: '강원도', icon: '🌲', accentColor: 'text-emerald-400', bgLight: 'bg-emerald-500/10' },
  { key: 'Gyeonggi', label: 'Gyeonggi-do', koreanLabel: '경기도', icon: '🌾', accentColor: 'text-teal-400', bgLight: 'bg-teal-500/10' },
  { key: 'Chungcheong', label: 'Chungcheong-do', koreanLabel: '충청도', icon: '🍁', accentColor: 'text-orange-400', bgLight: 'bg-orange-500/10' },
  { key: 'Jeolla', label: 'Jeolla-do', koreanLabel: '전라도', icon: '⛰️', accentColor: 'text-rose-400', bgLight: 'bg-rose-500/10' },
  { key: 'Gyeongnam', label: 'Gyeongnam', koreanLabel: '경상남도', icon: '🏞️', accentColor: 'text-indigo-400', bgLight: 'bg-indigo-500/10' },
  { key: 'Gyeongbuk', label: 'Gyeongbuk', koreanLabel: '경상북도', icon: '⛰️', accentColor: 'text-violet-400', bgLight: 'bg-violet-500/10' },
  { key: 'Ulsan', label: 'Ulsan', koreanLabel: '울산광역시', icon: '⚓', accentColor: 'text-cyan-400', bgLight: 'bg-cyan-500/10' },
  { key: 'Gimhae', label: 'Gimhae', koreanLabel: '김해시', icon: '🏔️', accentColor: 'text-yellow-400', bgLight: 'bg-yellow-500/10' },
  { key: 'Geoje', label: 'Geoje', koreanLabel: '거제시', icon: '🏝️', accentColor: 'text-teal-300', bgLight: 'bg-teal-500/10' },
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
  const [elevationFilter, setElevationFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'elev-desc' | 'elev-asc' | 'name-asc' | 'most-ascents'>('elev-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(36);

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

  // Calculate statistics per province
  const provinceStats = useMemo(() => {
    return PROVINCE_CONFIG.map((prov) => {
      const mountainsInProv = KOREA_ALL_MOUNTAINS.filter((m) => m.province === prov.key);
      const total = mountainsInProv.length;

      let visited = 0;
      let totalAscents = 0;

      mountainsInProv.forEach((m) => {
        const stats = visitedMountainsMap.get(m.id);
        if (stats && stats.count > 0) {
          visited += 1;
          totalAscents += stats.count;
        }
      });

      const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;

      return {
        ...prov,
        total,
        visited,
        totalAscents,
        percentage,
      };
    });
  }, [visitedMountainsMap]);

  // National overall stats
  const nationalStats = useMemo(() => {
    const totalMountains = KOREA_ALL_MOUNTAINS.length;
    let visitedCount = 0;
    let totalAscents = 0;

    KOREA_ALL_MOUNTAINS.forEach((m) => {
      const stats = visitedMountainsMap.get(m.id);
      if (stats && stats.count > 0) {
        visitedCount += 1;
        totalAscents += stats.count;
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
      total: 47,
      visited: 0,
      totalAscents: 0,
      percentage: 0,
    };
  }, [provinceStats]);

  // Filtered & Sorted mountains list for the interactive checklist
  const filteredMountains = useMemo(() => {
    const list = KOREA_ALL_MOUNTAINS.filter((m) => {
      // Province filter
      if (selectedProvinceFilter !== 'all' && m.province !== selectedProvinceFilter) {
        return false;
      }

      const isVisited = visitedMountainsMap.has(m.id);

      // Completion status filter
      if (completionFilter === 'visited' && !isVisited) return false;
      if (completionFilter === 'unvisited' && isVisited) return false;

      // Elevation range filter
      if (elevationFilter === 'high' && m.elevationM < 1000) return false;
      if (elevationFilter === 'mid' && (m.elevationM < 500 || m.elevationM >= 1000)) return false;
      if (elevationFilter === 'low' && m.elevationM >= 500) return false;

      // Difficulty filter
      if (difficultyFilter !== 'all' && m.difficulty !== difficultyFilter) return false;

      // Search query (English name, Korean name, peak name, region, badge)
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

    // Sort order
    list.sort((a, b) => {
      if (sortOrder === 'elev-desc') return b.elevationM - a.elevationM;
      if (sortOrder === 'elev-asc') return a.elevationM - b.elevationM;
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'most-ascents') {
        const aCount = visitedMountainsMap.get(a.id)?.count || 0;
        const bCount = visitedMountainsMap.get(b.id)?.count || 0;
        return bCount - aCount;
      }
      return 0;
    });

    return list;
  }, [
    selectedProvinceFilter,
    completionFilter,
    elevationFilter,
    difficultyFilter,
    sortOrder,
    searchQuery,
    visitedMountainsMap,
  ]);

  const displayedMountains = useMemo(() => {
    return filteredMountains.slice(0, visibleLimit);
  }, [filteredMountains, visibleLimit]);

  return (
    <div className="py-8 space-y-8">
      {/* SECTION 1: High Level Progress Heroes (Busan & Full Korea) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Busan Progress Hero Card */}
        <div className="relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-sky-500/30 overflow-hidden shadow-xl">
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

              <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mt-3">
                Busan Mountain Exploration
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                From Geumjeongsan, Baegyangsan & Dalumsan to coastal neighborhood peaks like Amisan, Amnamsan & Yongdusan.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold">
                  {busanStats.visited} of {busanStats.total} Busan Peaks Bagged
                </span>
                <span className="text-slate-400">
                  {busanStats.totalAscents} total recorded ascents
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, busanStats.percentage)}%` }}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800/80">
              <button
                onClick={() => {
                  setSelectedProvinceFilter('Busan');
                  setCompletionFilter('all');
                  setElevationFilter('all');
                  setSearchQuery('');
                }}
                className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Filter all {busanStats.total} Busan Peaks</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-slate-500 font-mono text-[11px]">
                {busanStats.total} cataloged coastal, urban & ridge peaks
              </span>
            </div>
          </div>
        </div>

        {/* Full Korea National Challenge Card */}
        <div className="relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-accent-border overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent-subtle rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-subtle text-accent border border-accent-border">
                  <span>⛰️</span>
                  <span>National Korea Alps (대한민국 명산)</span>
                </span>
                <span className="font-mono text-xs text-accent font-bold">
                  {nationalStats.percentage}% Complete
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mt-3">
                Full Korea Grand Traverse
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Tracking peaks bagged across all 12 Korean regions, from Bukhansan and Seoraksan to Hallasan.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold">
                  {nationalStats.visited} of {nationalStats.total} Korea Peaks Bagged
                </span>
                <span className="text-slate-400">
                  {nationalStats.totalAscents} total summits
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(4, nationalStats.percentage)}%` }}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800/80">
              <button
                onClick={() => {
                  setSelectedProvinceFilter('all');
                  setCompletionFilter('all');
                  setElevationFilter('all');
                  setSearchQuery('');
                }}
                className="text-accent hover:text-accent-hover font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Full National Directory</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-slate-500 font-mono text-[11px]">
                {nationalStats.total} total Korean peaks cataloged
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Province Grid Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-accent" />
              <span>Regional Province Progress</span>
            </h4>
            <p className="text-xs text-slate-400">
              Click any province to view its peaks, fortress ridges, and summit counts
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {provinceStats.length} Regions Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5">
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
                className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-accent shadow-md ring-1 ring-accent-glow'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">{prov.icon}</span>
                  <span className={`text-xs font-mono font-bold ${prov.accentColor}`}>
                    {prov.percentage}%
                  </span>
                </div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                  {prov.label}
                </h5>
                <p className="text-[11px] text-slate-400 font-sans truncate">{prov.koreanLabel}</p>

                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>
                    <strong className="text-slate-200">{prov.visited}</strong>/{prov.total}
                  </span>
                  <span>{prov.totalAscents} logs</span>
                </div>

                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1.5 border border-slate-800/60">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      prov.percentage > 0 ? 'bg-accent' : 'bg-slate-800'
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
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span>
                {selectedProvinceFilter === 'all'
                  ? 'All Korea Mountains Catalog'
                  : `${selectedProvinceFilter} Mountains Directory`}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filteredMountains.length} matching peaks
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive registry of small neighborhood hills and alpine summits across Korea.
            </p>
          </div>

          {/* Search bar with instant clear */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by peak name, hangul, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-accent transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar: Status, Elevation & Sorting */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Status filter tabs */}
            <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar max-w-full">
              <button
                onClick={() => setCompletionFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  completionFilter === 'all'
                    ? 'bg-accent text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setCompletionFilter('visited')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  completionFilter === 'visited'
                    ? 'bg-accent text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Summited ({nationalStats.visited})</span>
              </button>
              <button
                onClick={() => setCompletionFilter('unvisited')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  completionFilter === 'unvisited'
                    ? 'bg-accent text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Circle className="w-3.5 h-3.5 text-slate-500" />
                <span>Pending ({nationalStats.total - nationalStats.visited})</span>
              </button>
            </div>

            {/* Elevation Filter Tabs */}
            <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar max-w-full">
              <span className="text-[11px] text-slate-500 px-1 hidden sm:inline">Altitude:</span>
              <button
                onClick={() => setElevationFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                  elevationFilter === 'all'
                    ? 'bg-accent text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Heights
              </button>
              <button
                onClick={() => setElevationFilter('low')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                  elevationFilter === 'low'
                    ? 'bg-accent text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Neighborhood and coastal peaks under 500m"
              >
                Small & Urban (&lt;500m)
              </button>
              <button
                onClick={() => setElevationFilter('mid')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                  elevationFilter === 'mid'
                    ? 'bg-accent text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mid Ridge (500–1000m)
              </button>
              <button
                onClick={() => setElevationFilter('high')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                  elevationFilter === 'high'
                    ? 'bg-accent text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                High Alpine (&gt;1000m)
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Sort:</span>
              </span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="elev-desc">Elevation (Highest First)</option>
                <option value="elev-asc">Elevation (Lowest First)</option>
                <option value="name-asc">Name (A → Z)</option>
                <option value="most-ascents">Most Summited First</option>
              </select>
            </div>
          </div>

          {/* Active Filters row */}
          {(selectedProvinceFilter !== 'all' ||
            searchQuery.trim() !== '' ||
            elevationFilter !== 'all' ||
            completionFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span className="text-slate-500">Active filters:</span>
              {selectedProvinceFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-accent-subtle text-accent border border-accent-border font-medium inline-flex items-center gap-1">
                  <span>Region: {selectedProvinceFilter}</span>
                  <button onClick={() => setSelectedProvinceFilter('all')} className="hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {elevationFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-accent-subtle text-accent border border-accent-border font-medium inline-flex items-center gap-1">
                  <span>
                    Altitude:{' '}
                    {elevationFilter === 'low'
                      ? '< 500m'
                      : elevationFilter === 'mid'
                      ? '500–1000m'
                      : '> 1000m'}
                  </span>
                  <button onClick={() => setElevationFilter('all')} className="hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery.trim() !== '' && (
                <span className="px-2 py-0.5 rounded-md bg-accent-subtle text-accent border border-accent-border font-medium inline-flex items-center gap-1">
                  <span>Keyword: &ldquo;{searchQuery}&rdquo;</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedProvinceFilter('all');
                  setCompletionFilter('all');
                  setElevationFilter('all');
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-slate-200 underline cursor-pointer text-xs ml-1"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Mountains Grid */}
        {filteredMountains.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs sm:text-sm space-y-3">
            <p>No mountains found matching your search and filter criteria.</p>
            <button
              onClick={() => {
                setSelectedProvinceFilter('all');
                setCompletionFilter('all');
                setElevationFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-lg bg-accent text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1"
            >
              Clear filters and view all {nationalStats.total} mountains
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedMountains.map((mountain) => {
                const visitedInfo = visitedMountainsMap.get(mountain.id);
                const isVisited = Boolean(visitedInfo && visitedInfo.count > 0);

                return (
                  <div
                    key={mountain.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isVisited
                        ? 'bg-slate-950/80 border-emerald-500/30 hover:border-emerald-500/60 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-100">
                            {mountain.name}
                          </span>
                          <span className="text-xs text-slate-400 font-sans">
                            {mountain.koreanName}
                          </span>
                        </div>
                        <p className="text-xs text-accent font-mono mt-0.5">
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                          <Circle className="w-3 h-3 text-slate-600" />
                          <span>Unclimbed</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 font-mono font-bold">
                        {mountain.elevationM}m
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">
                        {mountain.province}
                      </span>
                      <span className="truncate">{mountain.regionDetail}</span>
                    </div>

                    {mountain.famousBadge && (
                      <div className="text-[10px] text-slate-400 line-clamp-1 mb-3 italic">
                        ★ {mountain.famousBadge}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      {isVisited ? (
                        <>
                          <button
                            onClick={() => onSelectMountain(mountain.id)}
                            className="text-accent hover:text-accent-hover font-semibold inline-flex items-center gap-1 cursor-pointer text-xs"
                          >
                            <span>Ascent Logs</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onLogAscentForMountain(mountain)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Log Repeat</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Goal: {mountain.elevationM}m
                          </span>
                          <button
                            onClick={() => onLogAscentForMountain(mountain)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-accent hover:bg-accent-hover text-slate-950 rounded-lg inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer"
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

            {/* Pagination / Expand Control */}
            {filteredMountains.length > visibleLimit && (
              <div className="pt-4 text-center">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 36)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  Load More Mountains (Showing {displayedMountains.length} of {filteredMountains.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
