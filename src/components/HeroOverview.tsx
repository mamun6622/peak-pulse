import React from 'react';
import { Mountain, Flame, ArrowUpRight, Award, Compass, ChevronRight, Plus, ShieldCheck } from 'lucide-react';
import { PersonalRecords, MountainSummary } from '../types/activity';

interface HeroOverviewProps {
  records: PersonalRecords;
  topMountain: MountainSummary | undefined;
  isAdmin: boolean;
  onSelectMountain: (mountainId: string) => void;
  onExploreSummits: () => void;
  onOpenLogModal: () => void;
  onOpenKoreaDirectory: () => void;
}

export const HeroOverview: React.FC<HeroOverviewProps> = ({
  records,
  topMountain,
  isAdmin,
  onSelectMountain,
  onExploreSummits,
  onOpenLogModal,
  onOpenKoreaDirectory,
}) => {
  return (
    <section className="border-b border-stone-800 bg-gradient-to-b from-stone-900/60 to-stone-950 pt-8 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Split Screen Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Typographic Hierarchy */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Clean metadata */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-amber-400 mb-3 tracking-wide">
              <span>Seoul, South Korea</span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span>Alpine & Trail Journal</span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span>Korea's 100 Famous Mountains</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-100 tracking-tight leading-[1.15] text-balance mb-4">
              Documenting Every Summit, Repeat Peak & River Mile
            </h1>

            <p className="text-stone-300 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl text-pretty">
              Personal mountaineering ascents and endurance runs across South Korea.
              Track repeat summit counts on each mountain with photo archives, ascent dates, elevation gain, and a progression ranking system.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onExploreSummits}
                className="px-5 py-2.5 text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] transition-all rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 inline-flex items-center gap-2"
              >
                <span>Browse Hall of Peaks</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenKoreaDirectory}
                className="px-4 py-2.5 text-sm font-medium text-stone-200 hover:text-white bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Korea 56+ Mountain Catalog</span>
              </button>

              {isAdmin && (
                <button
                  onClick={onOpenLogModal}
                  className="px-4 py-2.5 text-sm font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/40 rounded-lg transition-colors inline-flex items-center gap-1.5"
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
                className="group relative flex-1 bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="text-xs uppercase font-mono tracking-wider text-amber-400">
                      Most Summited Mountain
                    </span>
                    <span className="text-xs font-mono text-stone-400">
                      Latest: {topMountain.latestSummitDate}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mb-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                      {topMountain.mountainName}
                    </h2>
                    <span className="text-stone-400 text-xs font-normal">
                      {topMountain.koreanName}
                    </span>
                  </div>

                  <div className="text-sm text-stone-400 mb-4">
                    {topMountain.peakName} · {topMountain.elevationM}m Elevation
                  </div>

                  {/* Visual preview */}
                  {topMountain.coverPhoto && (
                    <div className="relative w-full h-40 sm:h-44 rounded-xl overflow-hidden mb-4 border border-stone-800 bg-stone-950">
                      <img
                        src={topMountain.coverPhoto}
                        alt={`${topMountain.mountainName} summit preview`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2.5 left-3 text-xs font-mono text-stone-200">
                        {topMountain.photoCount} Photos Archiving {topMountain.totalSummits} Ascents
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="text-stone-400">Repeat Count: </span>
                    <span className="font-bold text-amber-400 font-mono text-base">
                      {topMountain.totalSummits} Summits
                    </span>
                  </div>
                  <div className="text-stone-400">
                    Total Vertical: <span className="font-mono text-stone-200">{topMountain.totalElevationGainedM.toLocaleString()}m</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Basecamp Starter Card when 0 logs */
              <div className="flex-1 bg-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-2">
                    <span>Basecamp Ready</span>
                    <span>56+ Peaks Cataloged</span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-100 mb-2">
                    Expedition Tracker Online
                  </h3>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed mb-4">
                    Select any mountain from Busan, South Korea's national parks, provincial ridges, and alpine trails. Upload summit photos and see your repeat summit counter update automatically!
                  </p>
                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-300 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Seoul Peaks:</span>
                      <span>Bukhansan, Inwangsan, Gwanaksan...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">High Alpine:</span>
                      <span>Hallasan (1950m), Seoraksan, Jirisan...</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
                  <button
                    onClick={onOpenKoreaDirectory}
                    className="text-xs font-semibold text-amber-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Mountain Directory</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={onOpenLogModal}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 text-stone-950 text-xs font-bold"
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
        <div className="mt-10 pt-8 border-t border-stone-800/80 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-stone-400 font-medium mb-1">Total Summits Bagged</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-mono tabular-nums">
              {records.totalSummitsBagged}
            </div>
            <span className="text-xs text-stone-500 mt-1">Across {records.totalUniquePeaks} unique peaks</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-stone-400 font-medium mb-1">Repeat Mountain Leader</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
              {records.mostRepeatedMountain?.count || 0}×
            </div>
            <span className="text-xs text-stone-500 mt-1">
              {records.mostRepeatedMountain?.name || 'No peaks logged yet'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-stone-400 font-medium mb-1">Total Vertical Gained</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-mono tabular-nums">
              {records.totalElevationClimbedM.toLocaleString()}
              <span className="text-base text-stone-400 font-normal ml-1">m</span>
            </div>
            <span className="text-xs text-stone-500 mt-1">Combined hiking & trail climbing</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-stone-400 font-medium mb-1">Endurance Running</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-mono tabular-nums">
              {records.totalRunningKm}
              <span className="text-base text-stone-400 font-normal ml-1">km</span>
            </div>
            <span className="text-xs text-stone-500 mt-1">Hangang & city trails</span>
          </div>
        </div>
      </div>
    </section>
  );
};
