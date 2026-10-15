import type { Activity, SummitLog, RunningLog } from '../types/activity.ts';
import type { ProgressionStats, ProgressionBadge } from '../types/progression.ts';

const LEVEL_TIERS = [
  { level: 1, title: 'Trail Scout', expRequired: 0 },
  { level: 2, title: 'Ridge Walker', expRequired: 2000 },
  { level: 3, title: 'Peak Conqueror', expRequired: 6000 },
  { level: 4, title: 'Granite Veteran', expRequired: 14000 },
  { level: 5, title: 'Korea Alpine Master', expRequired: 26000 },
  { level: 6, title: 'Apex Ridge Legend', expRequired: 45000 },
];

export function calculateProgression(activities: Activity[]): ProgressionStats {
  const summits = activities.filter((a): a is SummitLog => a.activityType === 'summit');
  const runs = activities.filter((a): a is RunningLog => a.activityType === 'running');

  let totalElevationClimbed = 0;
  summits.forEach((s) => {
    totalElevationClimbed += s.elevationGainM || 0;
  });
  runs.forEach((r) => {
    totalElevationClimbed += r.elevationGainM || 0;
  });

  // Calculate mountain repeat frequency
  const mountainCounts = new Map<string, number>();
  summits.forEach((s) => {
    const key = s.mountainName.toLowerCase().trim();
    mountainCounts.set(key, (mountainCounts.get(key) || 0) + 1);
  });

  let maxRepeats = 0;
  mountainCounts.forEach((count) => {
    if (count > maxRepeats) maxRepeats = count;
  });

  // Calculate XP
  let exp = 0;
  // 1 XP per meter climbed
  exp += totalElevationClimbed;
  // 150 XP per summit
  exp += summits.length * 150;
  // 30 XP per km run
  const totalRunKm = runs.reduce((acc, r) => acc + (r.distanceKm || 0), 0);
  exp += Math.round(totalRunKm * 30);

  // Repeat bonuses
  mountainCounts.forEach((count) => {
    if (count >= 10) {
      exp += 1500;
    } else if (count >= 5) {
      exp += 500;
    }
  });

  // Determine Level
  let currentLevel = 1;
  let levelTitle = LEVEL_TIERS[0].title;
  let nextLevelTitle = LEVEL_TIERS[1].title;
  let expForCurrent = 0;
  let expForNext = LEVEL_TIERS[1].expRequired;

  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_TIERS[i].expRequired) {
      currentLevel = LEVEL_TIERS[i].level;
      levelTitle = LEVEL_TIERS[i].title;
      expForCurrent = LEVEL_TIERS[i].expRequired;
      if (i < LEVEL_TIERS.length - 1) {
        nextLevelTitle = LEVEL_TIERS[i + 1].title;
        expForNext = LEVEL_TIERS[i + 1].expRequired;
      } else {
        nextLevelTitle = 'Max Level Reached';
        expForNext = exp;
      }
      break;
    }
  }

  const denominator = expForNext - expForCurrent;
  const progressPercent = denominator > 0
    ? Math.min(100, Math.round(((exp - expForCurrent) / denominator) * 100))
    : 100;

  // Evaluate Badges
  const badges: ProgressionBadge[] = [
    {
      id: 'ten-repeats',
      title: 'Century Repeat Legend (10+)',
      description: 'Summited the exact same mountain 10 or more times.',
      iconName: 'Flame',
      unlocked: maxRepeats >= 10,
      progressText: `${maxRepeats} / 10 summits on top peak`,
      tier: 'platinum',
    },
    {
      id: 'five-repeats',
      title: 'Peak Specialist (5+)',
      description: 'Summited a single peak at least 5 times.',
      iconName: 'Award',
      unlocked: maxRepeats >= 5,
      progressText: `${maxRepeats} / 5 summits`,
      tier: 'gold',
    },
    {
      id: 'roof-of-korea',
      title: 'Roof of Korea (1,950m)',
      description: 'Bagged the summit of Hallasan on Jeju Island.',
      iconName: 'Mountain',
      unlocked: summits.some((s) => s.mountainName.toLowerCase().includes('halla')),
      progressText: summits.some((s) => s.mountainName.toLowerCase().includes('halla')) ? 'Completed' : 'Pending ascent',
      tier: 'platinum',
    },
    {
      id: 'sunrise-chaser',
      title: 'Alpine Dawn Walker',
      description: 'Logged 2 or more crisp sunrise morning summits.',
      iconName: 'Sunrise',
      unlocked: summits.filter((s) => s.weather === 'Crisp Sunrise').length >= 2,
      progressText: `${summits.filter((s) => s.weather === 'Crisp Sunrise').length} / 2 sunrises`,
      tier: 'silver',
    },
    {
      id: 'winter-snow',
      title: 'Sub-Zero Crampon Ascent',
      description: 'Conquered a winter ice or snow peak.',
      iconName: 'Snowflake',
      unlocked: summits.some((s) => s.weather === 'Winter Snow / Ice'),
      progressText: summits.some((s) => s.weather === 'Winter Snow / Ice') ? 'Earned' : 'Pending winter',
      tier: 'silver',
    },
    {
      id: 'runner-10k',
      title: 'Endurance Stride (10K+)',
      description: 'Logged a single continuous run of 10km or greater.',
      iconName: 'Footprints',
      unlocked: runs.some((r) => r.distanceKm >= 10),
      progressText: runs.some((r) => r.distanceKm >= 10) ? 'Completed' : 'Pending 10K',
      tier: 'bronze',
    },
  ];

  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  return {
    currentLevel,
    levelTitle,
    nextLevelTitle,
    currentExp: exp,
    expForCurrentLevel: expForCurrent,
    expForNextLevel: expForNext,
    progressPercent,
    totalMetersClimbed: Math.round(totalElevationClimbed),
    totalSummits: summits.length,
    totalRepeatsOnTopMountain: maxRepeats,
    badges,
    unlockedBadgesCount,
  };
}
