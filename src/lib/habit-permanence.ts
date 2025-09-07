import { HabitLog } from '@/types/journal';

export interface HabitPermanenceMetrics {
  automaticityScore: number;        // 0-100 (how automatic the habit feels)
  daysSinceStart: number;          // Total days since habit initiation
  consistencyScore: number;        // 0-100 (consistency of performance)
  permanenceStage: 'initiation' | 'development' | 'stabilization' | 'automatic';
  permanencePercentage: number;    // 0-100 (progress toward permanence)
  strengthLevel: 'weak' | 'developing' | 'strong' | 'automatic';
  projectedCompletionDays: number; // Days until habit becomes automatic
  missedOpportunityTolerance: number; // How many misses before regression
}

export interface HabitFormationStage {
  name: string;
  description: string;
  dayRange: [number, number];
  color: string;
  icon: string;
  tips: string[];
}

// Research-based habit formation stages
export const HABIT_FORMATION_STAGES: HabitFormationStage[] = [
  {
    name: 'Initiation',
    description: 'Building initial momentum - requires high motivation',
    dayRange: [1, 21],
    color: '#ef4444', // Red
    icon: '🌱',
    tips: [
      'Focus on consistency over perfection',
      'Start extremely small (2-minute rule)',
      'Use environmental cues and reminders',
      'Expect high mental effort - this is normal'
    ]
  },
  {
    name: 'Development', 
    description: 'Forming neural pathways - habit starts feeling easier',
    dayRange: [22, 66],
    color: '#f59e0b', // Amber
    icon: '🌿',
    tips: [
      'Maintain consistency even when motivation drops',
      'Missing 1-2 days won\'t derail progress significantly', 
      'Focus on context-dependent repetition',
      'Celebrate small wins to reinforce positive associations'
    ]
  },
  {
    name: 'Stabilization',
    description: 'Strengthening automaticity - habit requires less conscious effort',
    dayRange: [67, 154],
    color: '#10b981', // Emerald  
    icon: '🌳',
    tips: [
      'Habit should feel more natural and automatic',
      'Can handle occasional disruptions without losing momentum',
      'Focus on refining and optimizing the habit',
      'Consider gradually increasing complexity if desired'
    ]
  },
  {
    name: 'Automatic',
    description: 'Fully ingrained habit - performed automatically with minimal effort',
    dayRange: [155, Infinity],
    color: '#8b5cf6', // Purple
    icon: '🏆',
    tips: [
      'Habit is now part of your identity',
      'Performed automatically in response to cues',
      'Minimal conscious effort required',
      'Focus on maintaining environmental cues'
    ]
  }
];

/**
 * Calculate habit permanence based on research by Dr. Phillippa Lally (UCL)
 * and recent meta-analyses on habit formation timeframes
 */
export const calculateHabitPermanence = (logs: HabitLog[], startDate: Date): HabitPermanenceMetrics => {
  if (!logs || logs.length === 0) {
    return {
      automaticityScore: 0,
      daysSinceStart: 0,
      consistencyScore: 0,
      permanenceStage: 'initiation',
      permanencePercentage: 0,
      strengthLevel: 'weak',
      projectedCompletionDays: 66,
      missedOpportunityTolerance: 0
    };
  }

  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];
  
  // Count formation days based on actual tracking days, excluding today
  const trackingDays = [...logs].filter(log => log.date !== todayDateString);
  const daysSinceStart = Math.max(1, trackingDays.length);
  
  // Sort logs by date
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate consistency score (weighted toward recent performance)
  const totalDays = sortedLogs.length;
  const completedDays = sortedLogs.filter(log => log.completed).length;
  const baseConsistency = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
  
  // Weight recent performance more heavily (last 14 days = 60% weight)
  const recentLogs = sortedLogs.slice(-14);
  const recentCompletions = recentLogs.filter(log => log.completed).length;
  const recentConsistency = recentLogs.length > 0 ? (recentCompletions / recentLogs.length) * 100 : 0;
  
  const consistencyScore = (recentConsistency * 0.6) + (baseConsistency * 0.4);
  
  // Calculate current streak (critical for automaticity)
  let currentStreak = 0;
  for (let i = sortedLogs.length - 1; i >= 0; i--) {
    if (sortedLogs[i].completed) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Determine formation stage based on days and performance
  let currentStage: typeof HABIT_FORMATION_STAGES[0] = HABIT_FORMATION_STAGES[0];
  for (const stage of HABIT_FORMATION_STAGES) {
    if (daysSinceStart >= stage.dayRange[0] && daysSinceStart <= stage.dayRange[1]) {
      currentStage = stage;
      break;
    }
  }
  
  // Calculate automaticity score based on multiple factors
  const streakFactor = Math.min(currentStreak / 30, 1) * 40; // Max 40 points for 30+ day streak
  const consistencyFactor = (consistencyScore / 100) * 35; // Max 35 points for 100% consistency  
  const timeFactor = Math.min(daysSinceStart / 154, 1) * 25; // Max 25 points for 154+ days
  
  const automaticityScore = Math.min(streakFactor + consistencyFactor + timeFactor, 100);
  
  // Calculate permanence percentage (0-100% toward permanent habit)
  let permanencePercentage: number;
  if (daysSinceStart >= 154) {
    // After 154 days (research upper bound), base on automaticity score
    permanencePercentage = Math.min(95 + (automaticityScore * 0.05), 100);
  } else {
    // Before 154 days, combine time progression with performance
    const timeProgress = (daysSinceStart / 154) * 70; // 70% weight for time
    const performanceBonus = (automaticityScore / 100) * 30; // 30% weight for performance
    permanencePercentage = Math.min(timeProgress + performanceBonus, 95);
  }
  
  // Debug logging for specific habits
  if (logs.filter(log => log.completed).length > 0) {
    console.log(`Habit permanence calculation:
      Days since start: ${daysSinceStart}
      Time progress: ${daysSinceStart >= 154 ? 'N/A' : ((daysSinceStart / 154) * 70).toFixed(1)}%
      Performance bonus: ${daysSinceStart >= 154 ? 'N/A' : ((automaticityScore / 100) * 30).toFixed(1)}%
      Final permanence: ${permanencePercentage.toFixed(1)}%
      Automaticity score: ${automaticityScore.toFixed(1)}%`);
  }
  
  // Determine strength level
  let strengthLevel: HabitPermanenceMetrics['strengthLevel'] = 'weak';
  if (automaticityScore >= 80) strengthLevel = 'automatic';
  else if (automaticityScore >= 60) strengthLevel = 'strong';
  else if (automaticityScore >= 35) strengthLevel = 'developing';
  
  // Calculate projected completion days (when habit becomes automatic)
  let projectedCompletionDays = 66; // Default research average
  if (consistencyScore >= 80) {
    projectedCompletionDays = 45; // High consistency = faster formation
  } else if (consistencyScore >= 60) {
    projectedCompletionDays = 66; // Average consistency = average time
  } else if (consistencyScore >= 40) {
    projectedCompletionDays = 95; // Lower consistency = longer time
  } else {
    projectedCompletionDays = 120; // Poor consistency = much longer
  }
  
  // Calculate missed opportunity tolerance (how resilient the habit is)
  const missedOpportunityTolerance = Math.floor(automaticityScore / 20); // 0-5 misses tolerable
  
  return {
    automaticityScore,
    daysSinceStart,
    consistencyScore,
    permanenceStage: currentStage.name.toLowerCase() as any,
    permanencePercentage,
    strengthLevel,
    projectedCompletionDays,
    missedOpportunityTolerance
  };
};

/**
 * Get user-friendly habit status message based on science
 */
export const getHabitStatusMessage = (metrics: HabitPermanenceMetrics): string => {
  const { permanenceStage, daysSinceStart, automaticityScore, permanencePercentage } = metrics;
  
  switch (permanenceStage) {
    case 'initiation':
      return `Building foundation (${daysSinceStart}/21 days). High effort required - this is normal!`;
    case 'development':  
      return `Forming neural pathways (${daysSinceStart}/66 days). Getting easier each day.`;
    case 'stabilization':
      return `Strengthening automaticity (${daysSinceStart}/154 days). Habit becoming more natural.`;
    case 'automatic':
      return `Habit achieved! ${Math.round(permanencePercentage)}% permanent. Well done!`;
    default:
      return `Day ${daysSinceStart} - ${Math.round(automaticityScore)}% automatic`;
  }
};

/**
 * Get next milestone and encouragement based on current progress
 */
export const getNextMilestone = (metrics: HabitPermanenceMetrics): { 
  milestone: string; 
  daysUntil: number; 
  encouragement: string;
} => {
  const { daysSinceStart, permanenceStage } = metrics;
  
  switch (permanenceStage) {
    case 'initiation':
      return {
        milestone: 'Development Phase',
        daysUntil: 22 - daysSinceStart,
        encouragement: 'Almost through the hardest part! Keep going.'
      };
    case 'development':
      return {
        milestone: 'Habit Established',
        daysUntil: 67 - daysSinceStart,
        encouragement: 'Neural pathways forming. You\'re doing great!'
      };
    case 'stabilization':
      return {
        milestone: 'Full Automaticity',
        daysUntil: 155 - daysSinceStart,
        encouragement: 'So close to a permanent habit! Stay consistent.'
      };
    case 'automatic':
      return {
        milestone: 'Habit Mastery',
        daysUntil: 0,
        encouragement: 'Congratulations! This habit is now part of who you are.'
      };
    default:
      return {
        milestone: 'Next Level',
        daysUntil: 22 - daysSinceStart,
        encouragement: 'Every day builds stronger neural pathways.'
      };
  }
};

/**
 * Calculate habit resilience (how likely it is to persist through disruption)
 */
export const calculateHabitResilience = (metrics: HabitPermanenceMetrics): {
  resilience: number; // 0-100
  description: string;
} => {
  const { automaticityScore, daysSinceStart, consistencyScore } = metrics;
  
  // Combine multiple factors for resilience score
  const timeResilience = Math.min(daysSinceStart / 154, 1) * 40;
  const automaticityResilience = (automaticityScore / 100) * 35;
  const consistencyResilience = (consistencyScore / 100) * 25;
  
  const resilience = timeResilience + automaticityResilience + consistencyResilience;
  
  let description: string;
  if (resilience >= 85) {
    description = 'Highly resilient - can withstand significant disruptions';
  } else if (resilience >= 65) {
    description = 'Moderately resilient - can handle occasional breaks';  
  } else if (resilience >= 40) {
    description = 'Building resilience - be careful with disruptions';
  } else {
    description = 'Fragile - requires consistent daily practice';
  }
  
  return { resilience, description };
};

export interface HabitRiskAssessment {
  riskLevel: 'safe' | 'caution' | 'warning' | 'critical';
  consecutiveMissedDays: number;
  daysSinceLastCompletion: number;
  regressionRisk: number; // 0-100
  interventionMessage: string;
  urgencyScore: number; // 0-100, for visual prominence
}

/**
 * Assess habit risk based on missed days and formation stage
 * Research-based: Early stages more vulnerable, consecutive misses compound risk
 */
export const assessHabitRisk = (logs: HabitLog[], metrics: HabitPermanenceMetrics): HabitRiskAssessment => {
  if (!logs || logs.length === 0) {
    return {
      riskLevel: 'safe',
      consecutiveMissedDays: 0,
      daysSinceLastCompletion: 0,
      regressionRisk: 0,
      interventionMessage: 'No data yet - start tracking today!',
      urgencyScore: 0
    };
  }

  const today = new Date();
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Calculate consecutive missed days from today backwards
  let consecutiveMissedDays = 0;
  let daysSinceLastCompletion = 0;
  
  // Check yesterday and work backwards (skip today since it's not complete yet)
  for (let i = 1; i < 15; i++) { // Start from yesterday, check last 14 days max
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const logEntry = sortedLogs.find(log => log.date === dateStr);
    
    if (logEntry?.completed) {
      daysSinceLastCompletion = i;
      break;
    } else if (logEntry) {
      // Count as missed only if we have a log entry marked incomplete (excluding today)
      consecutiveMissedDays++;
      daysSinceLastCompletion++;
    }
  }

  // Stage-based risk factors (early stages more vulnerable)
  const { permanenceStage, automaticityScore } = metrics;
  
  let baseRiskMultiplier = 1.0;
  switch (permanenceStage) {
    case 'initiation':
      baseRiskMultiplier = 2.5; // Most fragile
      break;
    case 'development':
      baseRiskMultiplier = 1.8; // Still vulnerable
      break;
    case 'stabilization':
      baseRiskMultiplier = 1.2; // More resilient
      break;
    case 'automatic':
      baseRiskMultiplier = 0.6; // Highly resilient
      break;
  }

  // Calculate regression risk (research: single miss = minimal impact, consecutive misses = compound)
  let regressionRisk = 0;
  if (consecutiveMissedDays === 1) {
    regressionRisk = 15 * baseRiskMultiplier; // Single miss - minimal according to research
  } else if (consecutiveMissedDays === 2) {
    regressionRisk = 35 * baseRiskMultiplier; // Two misses - moderate concern
  } else if (consecutiveMissedDays >= 3) {
    // Research: consecutive misses weaken context-dependent links progressively
    regressionRisk = Math.min(20 + (consecutiveMissedDays * 15), 85) * baseRiskMultiplier;
  }
  
  // Adjust for automaticity strength (stronger habits more resilient)
  const automacityFactor = Math.max(0.3, 1 - (automaticityScore / 100) * 0.7);
  regressionRisk = Math.min(regressionRisk * automacityFactor, 100);

  // Determine risk level and intervention messages
  let riskLevel: HabitRiskAssessment['riskLevel'] = 'safe';
  let interventionMessage = '';
  let urgencyScore = 0;

  if (regressionRisk >= 75) {
    riskLevel = 'critical';
    urgencyScore = 95;
    interventionMessage = permanenceStage === 'initiation' 
      ? `🚨 Critical: ${consecutiveMissedDays} missed days in formation stage. Neural pathways weakening - act TODAY!`
      : `🚨 Critical: ${consecutiveMissedDays} consecutive misses. Context-dependent links severely weakened.`;
  } else if (regressionRisk >= 50) {
    riskLevel = 'warning';
    urgencyScore = 75;
    interventionMessage = permanenceStage === 'initiation'
      ? `⚠️ Warning: ${consecutiveMissedDays} missed days during vulnerable formation period. Recovery needed.`
      : `⚠️ Warning: ${consecutiveMissedDays} consecutive misses. Mental associations weakening.`;
  } else if (regressionRisk >= 25) {
    riskLevel = 'caution';
    urgencyScore = 45;
    interventionMessage = consecutiveMissedDays >= 2
      ? `⚡ Caution: Pattern disruption detected. Resume today to maintain momentum.`
      : `💪 Back on track opportunity - one miss won't hurt if you restart now.`;
  } else {
    riskLevel = 'safe';
    urgencyScore = 10;
    interventionMessage = daysSinceLastCompletion === 0 
      ? '✅ Great consistency! Neural pathways strengthening.'
      : '🎯 Good momentum - occasional misses are normal according to research.';
  }

  return {
    riskLevel,
    consecutiveMissedDays,
    daysSinceLastCompletion,
    regressionRisk: Math.round(regressionRisk),
    interventionMessage,
    urgencyScore: Math.round(urgencyScore)
  };
};