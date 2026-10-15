import React from 'react';
import { Trophy, Flame, Award, Mountain, Sunrise, Snowflake, Footprints, Shield, Compass, Sparkles } from 'lucide-react';
import { ProgressionStats, ProgressionBadge } from '../types/progression';

interface ProgressionHUDProps {
  stats: ProgressionStats;
  totalKoreaMountainsCount: number;
  uniqueSummitedCount: number;
}

export const ProgressionHUD: React.FC<ProgressionHUDProps> = ({
  stats,
  totalKoreaMountainsCount,
  uniqueSummitedCount,
}) => {
  const getBadgeIcon = (name: string) => {
    switch (name) {
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Award': return <Award className="w-4 h-4" />;
      case 'Mountain': return <Mountain className="w-4 h-4" />;
      case 'Sunrise': return <Sunrise className="w-4 h-4" />;
      case 'Snowflake': return <Snowflake className="w-4 h-4" />;
      default: return <Footprints className="w-4 h-4" />;
    }
  };

  const koreaCompletionPct = totalKoreaMountainsCount > 0
    ? Math.round((uniqueSummitedCount / totalKoreaMountainsCount) * 100)
    : 0;

  return (
    <section className="py-10 border-b border-stone-800 bg-stone-950/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HUD Command Console Box */}
        <div className="relative rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900/95 to-stone-900 border border-stone-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
          {/* Subtle tech grid lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#292524_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

          {/* Top Row: Level & XP Bar */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-800/80">
            <div className="flex items-center gap-4">
              {/* Level Hexagon / Emblem */}
              <div className="relative w-16 h-16 rounded-xl bg-amber-500/10 border-2 border-amber-400 flex flex-col items-center justify-center text-amber-400 shadow-lg shadow-amber-950/30 shrink-0">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-amber-300">
                  RANK
                </span>
                <span className="text-2xl font-black font-mono leading-none text-stone-100">
                  {String(stats.currentLevel).padStart(2, '0')}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-semibold">
                    Expedition Progression System
                  </span>
                  <span className="text-stone-600">·</span>
                  <span className="text-xs font-mono text-stone-400">
                    Korea Alpine Rank
                  </span>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-stone-100">
                  {stats.levelTitle}
                </h3>
                <div className="text-xs text-stone-400 mt-0.5">
                  Next Tier: <span className="text-stone-300 font-medium">{stats.nextLevelTitle}</span>
                </div>
              </div>
            </div>

            {/* XP Progress Gauge */}
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-stone-400">Expedition XP</span>
                <span className="text-amber-400 font-bold">
                  {stats.currentExp.toLocaleString()} / {stats.expForNextLevel.toLocaleString()} XP
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-stone-950 border border-stone-800 overflow-hidden p-0.5">
                <div
                  style={{ width: `${stats.progressPercent}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500 shadow-sm"
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-stone-500 mt-1.5">
                <span>Tier progress: {stats.progressPercent}%</span>
                <span>+{Math.max(0, stats.expForNextLevel - stats.currentExp).toLocaleString()} XP to next rank</span>
              </div>
            </div>
          </div>

          {/* Middle Row: 4 Metric Readouts */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-stone-800/80">
            <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80">
              <span className="text-[11px] font-mono uppercase text-stone-500 block mb-1">
                Vertical Ascent
              </span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-stone-100 tabular-nums">
                {stats.totalMetersClimbed.toLocaleString()}
                <span className="text-xs text-stone-400 font-normal ml-1">m</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80">
              <span className="text-[11px] font-mono uppercase text-stone-500 block mb-1">
                Summits Logged
              </span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-stone-100 tabular-nums">
                {stats.totalSummits}
                <span className="text-xs text-stone-400 font-normal ml-1">peaks</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80">
              <span className="text-[11px] font-mono uppercase text-stone-500 block mb-1">
                Top Peak Repeats
              </span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-400 tabular-nums">
                {stats.totalRepeatsOnTopMountain}×
                <span className="text-xs text-stone-400 font-normal ml-1">repeats</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80">
              <span className="text-[11px] font-mono uppercase text-stone-500 block mb-1">
                Korea Database Bagged
              </span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-stone-100 tabular-nums">
                {uniqueSummitedCount}
                <span className="text-xs text-stone-500 font-normal ml-1">/ {totalKoreaMountainsCount}</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Badges & Accomplishments Showcase */}
          <div className="relative z-10 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-stone-200">
                  Ascent Achievement Badges ({stats.unlockedBadgesCount} / {stats.badges.length})
                </h4>
              </div>
              <span className="text-xs font-mono text-stone-400">
                Expedition Milestones
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    badge.unlocked
                      ? 'bg-stone-950/80 border-amber-500/40 shadow-sm'
                      : 'bg-stone-950/30 border-stone-850 opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      badge.unlocked
                        ? 'bg-amber-500/10 border-amber-400 text-amber-400'
                        : 'bg-stone-900 border-stone-800 text-stone-600'
                    }`}
                  >
                    {getBadgeIcon(badge.iconName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs font-bold text-stone-100 truncate">
                        {badge.title}
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                        badge.unlocked ? 'text-amber-400 bg-amber-500/10' : 'text-stone-600 bg-stone-900'
                      }`}>
                        {badge.tier}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                      {badge.description}
                    </p>
                    <div className="text-[10px] font-mono text-stone-500 mt-1">
                      {badge.progressText}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
