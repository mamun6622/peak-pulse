import React from 'react';
import { Mountain, Flame, ArrowUpRight, Award, Compass, ChevronRight, Plus, ShieldCheck } from 'lucide-react';
import { PersonalRecords, MountainSummary } from '../types/activity';

interface HeroOverviewProps {
  activeTab: string;
  records: PersonalRecords;
  topMountain: MountainSummary | undefined;
  isAdmin: boolean;
  onSelectMountain: (mountainId: string) => void;
  onExploreSummits: () => void;
  onOpenLogModal: () => void;
  onOpenKoreaDirectory: () => void;
}

export const HeroOverview: React.FC<HeroOverviewProps> = ({
  activeTab,
  records,
  topMountain,
  isAdmin,
  onSelectMountain,
  onExploreSummits,
  onOpenLogModal,
  onOpenKoreaDirectory,
}) => {
  const tabHeaders: Record<string, { badge: string; title: string; desc: string }> = {
    summits: {
      badge: 'South Korea Summit Journal & Hall of Peaks',
      title: 'Documenting Every Summit, Repeat Peak & River Mile',
      desc: 'Personal mountaineering ascents and endurance runs across South Korea. Track repeat summit counts on each mountain with photo archives, ascent dates, and elevation gain.',
    },
    progress: {
      badge: 'Korea & Regional Mountain Progression HUD',
      title: 'Busan, Seoul, Gangwon, Gyeonggi, Gyeongnam, Ulsan, Gimhae & Geoje Explorer',
      desc: 'Track your summit completion progress across all provinces, metropolitan cities, and the 100 Famous Mountains of South Korea.',
    },
    running: {
      badge: 'Endurance Training & Riverfront Runs',
      title: 'Cardio Workouts, Pace Analytics & Trail Miles',
      desc: 'Log and analyze endurance running workouts, riverfront streams, trail runs, pacing metrics, and shoe mileage across South Korea.',
    },
    stats: {
      badge: 'Performance & Elevation Analytics',
      title: 'Monthly Vertical Gains & Ascent Statistics',
      desc: 'Comprehensive breakdown of monthly mountaineering activity, total meters climbed, cumulative distance traveled, and personal mountaineering records.',
    },
    map: {
      badge: 'Geographic GIS Map',
      title: 'South Korea Summit & Coastal Ridge Map',
      desc: 'Interactive geographic map of conquered peaks across the Korean peninsula and Jeju Island with repeat ascent pins.',
    },
    photos: {
      badge: 'Expedition Visual Archive',
      title: 'Compressed Photo Gallery & Lightbox Collection',
      desc: "High-resolution visual memories, summit panoramas, and trail snapshots captured across South Korea's stunning peaks.",
    },
  };

  const currentHeader = tabHeaders[activeTab] || tabHeaders.summits;

  return (
    <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950 pt-8 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Split Screen Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Dynamic Typographic Hierarchy */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Clean metadata */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-accent mb-3 tracking-wide">
              <span>South Korea</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{currentHeader.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 tracking-tight leading-[1.15] text-balance mb-4">
              {currentHeader.title}
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl text-pretty">
              {currentHeader.desc}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onExploreSummits}
                className="px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent-hover active:scale-[0.98] transition-all rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Browse Hall of Peaks</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenKoreaDirectory}
                className="px-4 py-2.5 text-sm font-medium text-slate-200 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-accent" />
                <span>Korea 60+ Mountain Catalog</span>
              </button>

              {isAdmin && (
                <button
                  onClick={onOpenLogModal}
                  className="px-4 py-2.5 text-sm font-semibold text-accent bg-accent-subtle hover:bg-slate-800 border border-accent-border rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Log Ascent</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Featured Top Peak or Expedition Basecamp Card */}
          <div className="lg:col-span-5 flex flex-col">
            {topMountain ? (
              <div
                onClick={() => onSelectMountain(topMountain.mountainId)}
                className="group relative flex-1 bg-slate-900 border border-slate-800 hover:border-accent-border rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-subtle rounded-full blur-3xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="text-xs uppercase font-mono tracking-wider text-accent font-semibold">
                      Most Summited Mountain
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Latest: {topMountain.latestSummitDate}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mb-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 group-hover:text-accent transition-colors">
                      {topMountain.mountainName}
                    </h2>
                    <span className="text-slate-400 text-xs font-normal">
                      {topMountain.koreanName}
                    </span>
                  </div>

                  <div className="text-sm text-slate-400 mb-4">
                    {topMountain.peakName} · {topMountain.elevationM}m Elevation
                  </div>

                  {/* Visual preview */}
                  {topMountain.coverPhoto && (
                    <div className="relative w-full h-40 sm:h-44 rounded-xl overflow-hidden mb-4 border border-slate-800 bg-slate-950">
                      <img
                        src={topMountain.coverPhoto}
                        alt={`${topMountain.mountainName} summit preview`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2.5 left-3 text-xs font-mono text-slate-200">
                        {topMountain.photoCount} Photos Archiving {topMountain.totalSummits} Ascents
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-400">Repeat Count: </span>
                    <span className="font-bold text-accent font-mono text-base">
                      {topMountain.totalSummits} Summits
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Total Vertical: <span className="font-mono text-slate-200">{topMountain.totalElevationGainedM.toLocaleString()}m</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Basecamp Starter Card when 0 logs */
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-accent mb-2">
                    <span>Basecamp Ready</span>
                    <span>60+ Peaks Cataloged</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">
                    Expedition Tracker Online
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                    Select any mountain from Busan, Ulsan, Gimhae, Geoje, national parks, and alpine trails. Upload summit photos and see your repeat summit counter update automatically!
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Busan & Ulsan:</span>
                      <span>Geumjeongsan, Jangsan, Munsusan...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">High Alpine:</span>
                      <span>Hallasan (1950m), Seoraksan, Jirisan...</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={onOpenKoreaDirectory}
                    className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Mountain Directory</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={onOpenLogModal}
                      className="px-3 py-1.5 rounded-lg bg-accent text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      + Log Ascent
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full-width KPI strip below the split */}
        <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium mb-1">Total Summits Bagged</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tabular-nums">
              {records.totalSummitsBagged}
            </div>
            <span className="text-xs text-slate-500 mt-1">Across {records.totalUniquePeaks} unique peaks</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium mb-1">Repeat Mountain Leader</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-accent font-mono tabular-nums">
              {records.mostRepeatedMountain?.count || 0}×
            </div>
            <span className="text-xs text-slate-500 mt-1">
              {records.mostRepeatedMountain?.name || 'No peaks logged yet'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium mb-1">Total Vertical Gained</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tabular-nums">
              {records.totalElevationClimbedM.toLocaleString()}
              <span className="text-base text-slate-400 font-normal ml-1">m</span>
            </div>
            <span className="text-xs text-slate-500 mt-1">Combined hiking & trail climbing</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium mb-1">Endurance Running</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tabular-nums">
              {records.totalRunningKm}
              <span className="text-base text-slate-400 font-normal ml-1">km</span>
            </div>
            <span className="text-xs text-slate-500 mt-1">Hangang & city trails</span>
          </div>
        </div>
      </div>
    </section>
  );
};
