export interface ExpeditionData {
  points: number;
  activeTier: string;
}

export interface IMilestone {
  id: string;
  name: string;
  description: string;
  actionType: string;
  points: number;
  completed: boolean;
  requirement?: { count?: number; volume?: number; amount?: number; days?: number };
  action?: string;
  link?: { url: string; target: string; type?: string; metadata?: Record<string, any> };
  icon: string;
  actionText: string;
}

export interface ITier {
  id: number;
  name: string;
  title: string;
  description: string;
  milestones: IMilestone[];
  totalPoints: number;
  badgeIcon: string;
  badgeBackground: string;
  borderGradient: string;
  tagIcon: string;
  unlocked: boolean;
}
