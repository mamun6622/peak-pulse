import React, { useState } from 'react';
import { BarChart3, TrendingUp, Trophy, Calendar, Mountain, Footprints, Flame, ArrowUp } from 'lucide-react';
import { MonthlyStats, PersonalRecords, Activity } from '../types/activity';

interface MonthlyStatsDashboardProps {
  monthlyStats: MonthlyStats[];
  records: PersonalRecords;
  activities: Activity[];
}

export const MonthlyStatsDashboard: React.FC<MonthlyStatsDashboardProps> = ({
  monthlyStats,
  records,
  activities,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'elevation' | 'distance' | 'summits'>('elevation');

  // Find maximum values for chart normalization
  const maxElevation = Math.max(...monthlyStats.map((m) => m.totalElevationGainM), 1000);
  const maxDistance = Math.max(...monthlyStats.map((m) => m.totalDistanceKm), 50);
  const maxSummits = Math.max(...monthlyStats.map((m) => m.totalSummits), 5);

  return (
    <section className="py-12 border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Monthly Progress & Analytics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
              Monthly Elevation, Distance & Peak Trends
            </h2>
            <p className="text-stone-400 text-sm mt-1 max-w-2xl">
              Tracking endurance trends across seasons in South Korea, comparing vertical meters climbed versus running volume.
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-xl text-xs">
            <button
              onClick={() => setSelectedMetric('elevation')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedMetric === 'elevation'
                  ? 'bg-amber-400 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Vertical Elevation (m)
            </button>
            <button
              onClick={() => setSelectedMetric('distance')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedMetric === 'distance'
                  ? 'bg-amber-400 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Total Distance (km)
            </button>
            <button
              onClick={() => setSelectedMetric('summits')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedMetric === 'summits'
                  ? 'bg-amber-400 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Peak Summits Bagged
            </button>
          </div>
        </div>

        {/* Personal Records Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-400 font-medium">Highest Altitude Bagged</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-stone-100 font-mono">
                {records.highestPeakBagged?.elevationM.toLocaleString()}m
              </div>
              <div className="text-xs text-amber-400 font-medium mt-1 truncate">
                {records.highestPeakBagged?.name}
              </div>
              <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                {records.highestPeakBagged?.date}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-400 font-medium">Most Repeated Mountain</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                {records.mostRepeatedMountain?.count}× Summits
              </div>
              <div className="text-xs text-stone-200 font-medium mt-1 truncate">
                {records.mostRepeatedMountain?.name} ({records.mostRepeatedMountain?.koreanName})
              </div>
              <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                {records.mostRepeatedMountain?.elevationM}m elevation
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-400 font-medium">Biggest Elevation Day</span>
              <Mountain className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-stone-100 font-mono">
                +{records.biggestElevationDayM?.elevationGainM.toLocaleString()}m
              </div>
              <div className="text-xs text-stone-200 font-medium mt-1 truncate">
                {records.biggestElevationDayM?.title}
              </div>
              <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                {records.biggestElevationDayM?.date}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-400 font-medium">Longest Running Session</span>
              <Footprints className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-stone-100 font-mono">
                {records.longestRunKm?.distanceKm} km
              </div>
              <div className="text-xs text-stone-200 font-medium mt-1 truncate">
                {records.longestRunKm?.title}
              </div>
              <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                {records.longestRunKm?.date}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Monthly Histogram Bar Chart */}
        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-stone-200">
              Monthly {selectedMetric === 'elevation' ? 'Vertical Climbed (Meters)' : selectedMetric === 'distance' ? 'Total Distance (Kilometers)' : 'Summits Bagged'}
            </h3>
            <span className="text-xs font-mono text-stone-400">
              {monthlyStats.length} months tracked
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2 sm:gap-3 items-end h-56 pt-6 pb-2 border-b border-stone-800">
            {monthlyStats.slice(0, 12).reverse().map((m) => {
              let value = 0;
              let heightPct = 0;
              if (selectedMetric === 'elevation') {
                value = m.totalElevationGainM;
                heightPct = Math.min(100, Math.round((value / maxElevation) * 100));
              } else if (selectedMetric === 'distance') {
                value = m.totalDistanceKm;
                heightPct = Math.min(100, Math.round((value / maxDistance) * 100));
              } else {
                value = m.totalSummits;
                heightPct = Math.min(100, Math.round((value / maxSummits) * 100));
              }

              return (
                <div key={m.monthKey} className="group flex flex-col items-center h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-amber-300 mb-1 text-center whitespace-nowrap">
                    {value.toLocaleString()}
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: `${Math.max(6, heightPct)}%` }}
                    className="w-full bg-stone-800 group-hover:bg-amber-400 rounded-t-md transition-all duration-300 relative"
                  />
                  {/* Label */}
                  <div className="text-[11px] font-mono text-stone-400 mt-2 truncate w-full text-center">
                    {m.label.split(' ')[0]}
                  </div>
                  <div className="text-[9px] font-mono text-stone-500">
                    '{m.year.toString().slice(-2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Monthly Breakdown Table */}
        <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-200">
              Detailed Monthly Breakdown Table
            </h3>
            <span className="text-xs text-stone-400">Summits, Runs, and Verticality</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-stone-950/70 text-stone-400 border-b border-stone-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-sans">Month</th>
                  <th className="py-3 px-4">Summits</th>
                  <th className="py-3 px-4">Runs</th>
                  <th className="py-3 px-4">Distance</th>
                  <th className="py-3 px-4">Elevation Gained</th>
                  <th className="py-3 px-4">Active Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {monthlyStats.map((m) => (
                  <tr key={m.monthKey} className="hover:bg-stone-850/50 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-stone-100 whitespace-nowrap">
                      {m.label}
                    </td>
                    <td className="py-3 px-4 text-amber-400 font-bold whitespace-nowrap">
                      {m.totalSummits} {m.totalSummits > 0 ? 'summits' : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {m.totalRuns} {m.totalRuns > 0 ? 'runs' : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {m.totalDistanceKm} km
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-stone-100 font-bold">
                      +{m.totalElevationGainM.toLocaleString()}m
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-stone-400">
                      {Math.floor(m.totalDurationMinutes / 60)}h {m.totalDurationMinutes % 60}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
