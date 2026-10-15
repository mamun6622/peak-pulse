export interface ProgressionBadge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  unlockedDate?: string;
  progressText: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface ProgressionStats {
  currentLevel: number;
  levelTitle: string;
  nextLevelTitle: string;
  currentExp: number;
  expForCurrentLevel: number;
  expForNextLevel: number;
  progressPercent: number; // 0 to 100
  totalMetersClimbed: number;
  totalSummits: number;
  totalRepeatsOnTopMountain: number;
  badges: ProgressionBadge[];
  unlockedBadgesCount: number;
}
