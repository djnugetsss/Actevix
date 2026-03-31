import type { SessionLog } from '@/types/sessionLog';

export const SPORTS = ['Basketball', 'Football', 'Gym', 'Soccer', 'Other'] as const;
export const WORKOUT_TYPES = ['Legs', 'Upper Body', 'Full Body', 'Practice', 'Game'] as const;
export const MUSCLE_GROUPS = [
  'Quads',
  'Hamstrings',
  'Calves',
  'Shoulders',
  'Back',
  'Chest',
  'Arms',
  'Knees',
  'Ankles',
] as const;

export const RECOVERY_TIPS: Record<string, string[]> = {
  Knees: [
    'Low-impact activity only (swimming, cycling)',
    'Quad & hamstring stretching',
    'Ice for 15 min post-activity',
  ],
  Quads: ['Foam roll quads daily', 'Hip flexor stretches', 'Avoid heavy squats for 48hrs'],
  Hamstrings: [
    'Seated hamstring stretches',
    'Romanian deadlifts with light weight',
    'Massage gun on posterior chain',
  ],
  Calves: ['Calf raises with slow eccentric', 'Downward dog yoga pose', 'Elevate legs when resting'],
  Shoulders: [
    'Shoulder CARs (controlled articular rotations)',
    'Avoid overhead pressing',
    'Band pull-aparts',
  ],
  Back: ["Cat-cow stretches", "Child's pose", 'Avoid loaded spinal flexion'],
  Chest: ['Doorway chest stretch', 'Light band flys', 'Upper body rest day'],
  Arms: ['Forearm stretches', 'Light bicep curls', 'Ice for elbow tenderness'],
  Ankles: ['Ankle circles', 'Single-leg balance work', 'Tape or brace for activity'],
};

export function getScoreColor(score: number): string {
  if (score === 0) return '#2a2d3a';
  if (score < 3) return '#4ade80';
  if (score < 5) return '#facc15';
  if (score < 7.5) return '#fb923c';
  return '#ef4444';
}

export function getScoreLabel(score: number): string {
  if (score === 0) return 'Normal';
  if (score < 3) return 'Light';
  if (score < 5) return 'Moderate';
  if (score < 7.5) return 'High Stress';
  return 'Injury Risk';
}

export function getRiskLabel(score: number): { label: string; color: string } {
  if (score < 3) return { label: 'Low', color: '#4ade80' };
  if (score < 5.5) return { label: 'Moderate', color: '#facc15' };
  if (score < 7.5) return { label: 'High', color: '#fb923c' };
  return { label: 'Critical', color: '#ef4444' };
}

export function generateInsight(
  scores: Record<string, number>,
  logs: SessionLog[]
): string {
  const top = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v > 0);
  if (top.length === 0)
    return 'No workout data logged yet. Start by adding your first session to get personalized insights.';

  const [topMuscle, topScore] = top[0];
  const overall =
    Object.values(scores).reduce((a, b) => a + b, 0) / MUSCLE_GROUPS.length;
  const risk = getRiskLabel(overall);

  let msg = `Your ${topMuscle.toLowerCase()} region shows the highest stress (${topScore.toFixed(1)}/10). `;

  if (topScore >= 7.5) {
    msg += `This level of strain suggests potential injury risk. Immediate rest and recovery are strongly recommended. `;
  } else if (topScore >= 5) {
    msg += `This indicates accumulated fatigue from recent sessions. Reduce load on this area for the next 24–48 hours. `;
  } else {
    msg += `This is manageable, but keep an eye on it if you plan back-to-back sessions. `;
  }

  if (top.length > 1) {
    msg += `Secondary stress in your ${top[1][0].toLowerCase()} should also be monitored. `;
  }

  if (risk.label === 'Low') msg += 'Overall, your body is in good shape — keep maintaining balance.';
  else if (risk.label === 'Moderate')
    msg += 'Consider a recovery day or active rest to prevent overuse injuries.';
  else msg += 'Prioritize sleep, hydration, and mobility work before your next intense session.';

  return msg;
}

/** Mean fatigue across muscle groups (0–10 scale). */
export function overallFatigue(scores: Record<string, number>): number {
  return (
    MUSCLE_GROUPS.reduce((sum, m) => sum + (scores[m] ?? 0), 0) / MUSCLE_GROUPS.length
  );
}

/** Highest-stress muscle if any load > 0. */
export function topStressMuscle(
  scores: Record<string, number>
): { muscle: string; value: number } | null {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [muscle, value] = sorted[0] ?? [];
  if (muscle == null || (value ?? 0) <= 0) return null;
  return { muscle, value };
}

export function computeScores(log: SessionLog | null): Record<string, number> {
  const scores: Record<string, number> = {};
  MUSCLE_GROUPS.forEach((m) => {
    scores[m] = 0;
  });
  if (!log) return scores;

  const intensityFactor = log.intensity / 10;
  const durationFactor = Math.min(log.duration / 90, 1);
  const amplifier = 0.6 + intensityFactor * 0.8 + durationFactor * 0.6;

  log.muscles.forEach((m) => {
    scores[m] = Math.min((scores[m] || 0) + 3 * amplifier, 10);
  });
  log.painAreas.forEach((m) => {
    scores[m] = Math.min((scores[m] || 0) + log.painLevel * 0.8 * amplifier, 10);
  });

  return scores;
}
