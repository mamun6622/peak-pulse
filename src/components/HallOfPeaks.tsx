import React, { useState } from 'react';
import { Mountain, Camera, Calendar, ArrowUpRight, Plus, MapPin, Compass, BookOpen } from 'lucide-react';
import { MountainSummary } from '../types/activity';

interface HallOfPeaksProps {
  mountains: MountainSummary[];
  isAdmin: boolean;
  onSelectMountain: (mountainId: string) => void;
  onQuickLogForMountain: (mountain: MountainSummary) => void;
  onOpenKoreaDirectory: () => void;
  onOpenLogModal: () => void;
}

export const HallOfPeaks: React.FC<HallOfPeaksProps> = ({
  mountains,
  isAdmin,
  onSelectMountain,
  onQuickLogForMountain,
  onOpenKoreaDirectory,
  onOpenLogModal,
}) => {
  const [filterRegion, setFilterRegion] = useState<string>('all');

  // Extract regions
  const regions = ['all', ...Array.from(new Set(mountains.map((m) => m.region)))];

  const filtered = filterRegion === 'all'
    ? mountains
    : mountains.filter((m) => m.region === filterRegion);

  return (
    <section id="hall-of-peaks" className="py-12 border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <Mountain className="w-3.5 h-3.5" />
              <span>Hall of Peaks & Repeat Summits</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
              Which Mountain, How Many Times & When
            </h2>
            <p className="text-stone-400 text-sm mt-1 max-w-2xl">
              Mountains in South Korea ranked by ascent frequency. Click any peak to inspect the full chronological breakdown of every individual summit, route, and photo log.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenKoreaDirectory}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-400 text-stone-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Korea Peak Catalog (56+)</span>
            </button>

            {/* Region Filter Segmented Control */}
            {regions.length > 1 && (
              <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-xl overflow-x-auto text-xs">
                {regions.map((reg) => (
                  <button
                    key={reg}
                    onClick={() => setFilterRegion(reg)}
                    className={`px-3 py-1 font-medium rounded-lg transition-colors whitespace-nowrap ${
                      filterRegion === reg
                        ? 'bg-amber-400 text-stone-950 font-semibold shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {reg === 'all' ? 'All Peaks' : reg}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {mountains.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-stone-900/60 border border-stone-800 max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <Mountain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-100 mb-2">
              Expedition Log Ready
            </h3>
            <p className="text-stone-400 text-sm mb-6 leading-relaxed">
              No summit ascents have been logged yet. Pick any peak from Korea's 56+ famous mountains database (including Busan, national parks, and provincial ridges) to record your date, photos, and trail details.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onOpenKoreaDirectory}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold inline-flex items-center gap-2 border border-stone-700 transition-colors"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Browse Korea Mountains</span>
              </button>
              {isAdmin ? (
                <button
                  onClick={onOpenLogModal}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Log First Summit</span>
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          /* Mountain Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((mountain) => {
              const isDoubleDigit = mountain.totalSummits >= 10;
              return (
                <div
                  key={mountain.mountainId}
                  className={`group relative bg-stone-900 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                    isDoubleDigit
                      ? 'border-amber-500/40 hover:border-amber-400 shadow-lg shadow-amber-950/20'
                      : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {/* Visual Cover / Banner */}
                  <div
                    onClick={() => onSelectMountain(mountain.mountainId)}
                    className="relative h-44 bg-stone-950 cursor-pointer overflow-hidden"
                  >
                    {mountain.coverPhoto ? (
                      <img
                        src={mountain.coverPhoto}
                        alt={`${mountain.mountainName} cover`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-900 text-stone-600">
                        <Mountain className="w-12 h-12 stroke-[1.5]" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                    {/* Summit Count Banner Overlay */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-tight shadow-md ${
                        isDoubleDigit
                          ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300/50'
                          : 'bg-stone-900/90 text-stone-200 border border-stone-700 backdrop-blur-sm'
                      }`}>
                        {mountain.totalSummits} Summits {isDoubleDigit ? '★' : ''}
                      </span>
                    </div>

                    {/* Photo count indicator */}
                    {mountain.photoCount > 0 && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 bg-stone-950/80 backdrop-blur-sm border border-stone-800 rounded-lg text-xs font-mono text-stone-300 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>{mountain.photoCount} photos</span>
                      </div>
                    )}

                    {/* Mountain Name & Elevation on Image Bottom */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-xl font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                            {mountain.mountainName}
                          </h3>
                          {mountain.koreanName && (
                            <span className="text-stone-400 text-xs font-medium">
                              {mountain.koreanName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {mountain.peakName}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-amber-400 font-mono">
                          {mountain.elevationM}
                        </span>
                        <span className="text-xs text-stone-400 ml-0.5">m</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    {/* Metadata unboxed text */}
                    <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                      <div>
                        <span className="text-stone-500 block mb-0.5">Latest Ascent</span>
                        <span className="font-mono text-stone-300 font-medium">
                          {mountain.latestSummitDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block mb-0.5">First Ascent</span>
                        <span className="font-mono text-stone-300 font-medium">
                          {mountain.firstSummitDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block mb-0.5">Total Vertical</span>
                        <span className="font-mono text-stone-300 font-medium">
                          {mountain.totalElevationGainedM.toLocaleString()}m
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block mb-0.5">Total Distance</span>
                        <span className="font-mono text-stone-300 font-medium">
                          {mountain.totalDistanceKm} km
                        </span>
                      </div>
                    </div>

                    {/* Milestones / Tags */}
                    {isDoubleDigit && (
                      <div className="py-2 px-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                        <span className="font-medium">10+ Ascent Club</span>
                        <span className="font-mono text-[11px] text-amber-400/80">Century Repeat</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectMountain(mountain.mountainId)}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Inspect {mountain.totalSummits} Summits</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickLogForMountain(mountain);
                          }}
                          className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
                          title={`Log Summit #${mountain.totalSummits + 1} for ${mountain.mountainName}`}
                          aria-label={`Log next summit for ${mountain.mountainName}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
