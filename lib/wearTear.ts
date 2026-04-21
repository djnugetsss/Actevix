import type { SessionLog } from '@/types/sessionLog';

export const SPORTS = [
  'Basketball', 'Football', 'Soccer', 'Baseball', 'Softball',
  'Tennis', 'Swimming', 'Track & Field', 'Volleyball', 'Wrestling',
  'MMA / Boxing', 'Lacrosse', 'Hockey', 'Rugby', 'Golf',
  'Cycling', 'CrossFit', 'Gymnastics', 'Dance', 'Cheerleading',
  'Rowing', 'Working Out', 'Other',
] as const;
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

const GENERIC_TIPS: Record<string, string[]> = {
  Quads: ['Foam roll quads 60sec each side', 'Hip flexor stretch 3x30sec', 'Avoid heavy squats for 48hrs'],
  Hamstrings: ['Seated hamstring stretch 3x30sec', 'Romanian deadlifts with light weight', 'Massage gun on posterior chain 2min'],
  Calves: ['Eccentric calf raises 3x15 slow', 'Downward dog hold 60sec', 'Elevate legs when resting'],
  Shoulders: ['Shoulder CARs 5 reps each direction', 'Band pull-aparts 3x15', 'Avoid overhead pressing'],
  Back: ['Cat-cow 10 reps', "Child's pose 60sec", 'Avoid loaded spinal flexion'],
  Chest: ['Doorway chest stretch 3x30sec', 'Light band flys only', 'Upper body rest day'],
  Arms: ['Forearm flexor stretch 3x20sec', 'Light bicep curls only', 'Ice elbow if tender 15min'],
  Knees: ['Quad and hamstring stretching 3x30sec', 'Low-impact only — swimming or cycling', 'Ice 15min post-activity'],
  Ankles: ['Ankle alphabet circles both directions', 'Single-leg balance 3x30sec', 'Tape or brace for next session'],
};

const SPORT_SPECIFIC_TIPS: Record<string, string[]> = {
  'Basketball:Knees': ['Patellar tendon loading — Spanish squats 3x30sec', 'Quad strengthening — leg press light', 'Avoid deep squats and jumping for 48hrs'],
  'Basketball:Ankles': ['Ankle resistance band eversion 3x15', 'Single-leg proprioception drills 3x30sec', 'Tape ankles before next session'],
  'Basketball:Quads': ['Foam roll IT band and quads', 'Step-down eccentric control 3x10', 'No explosive cutting for 24hrs'],

  'Soccer:Hamstrings': ['Nordic curl progressions 3x6', 'Active isolated hamstring stretch 10 reps', 'No sprinting for 48hrs — jog only'],
  'Soccer:Knees': ['ACL prevention — lateral band walks 3x15', 'Single-leg squat control 3x8 each', 'Ice 15min post activity'],
  'Soccer:Calves': ['Eccentric calf raises on step 3x12', 'Achilles tendon load management', 'Reduce sprint volume 50% next session'],
  'Soccer:Ankles': ['Peroneal strengthening — band eversion 3x15', 'Ankle stability drills', 'Reduce mileage 30% next session'],

  'Swimming:Shoulders': ['Rotator cuff band external rotation 3x15', 'Sleeper stretch 3x30sec', 'Avoid freestyle for 24hrs — backstroke only or rest'],
  'Swimming:Back': ['Lat stretch doorway 3x30sec', 'Thoracic spine mobility — foam roller extensions', 'Pull buoy only next session to unload rotation'],
  'Swimming:Arms': ['Wrist flexor stretch 3x20sec', 'Forearm massage 2min each', 'Reduce stroke volume next session'],

  'Football:Shoulders': ['AC joint rest — no overhead pressing', 'Band pull-aparts 3x15', 'No overhead pressing for 48hrs'],
  'Football:Knees': ['ACL and meniscus load management — no cutting drills', 'Quad and hamstring balance work', 'Ice 15min post activity'],
  'Football:Back': ['McGill Big 3 — curl up, side plank, bird dog 3x8 each', 'No loaded flexion', 'Deload day recommended'],
  'Football:Neck': ['Isometric neck strengthening 3x10 each direction', 'No contact drills today', 'See physio if stiffness persists 48hrs'],

  'Tennis:Shoulders': ['Rotator cuff prehab — empty can 3x15', 'Posterior capsule stretch 3x30sec', 'No serving for 24hrs'],
  'Tennis:Arms': ['Forearm flexor and extensor stretch 3x30sec', 'Massage gun on forearm 2min', 'Tennis elbow strap during next session'],

  'Wrestling:Shoulders': ['AC joint and labrum load management', 'No overhead pressing', 'Isometric shoulder holds 3x15sec'],
  'Wrestling:Neck': ['Isometric neck work all directions 3x10', 'No rolling today', 'Heat pack 15min to release tension'],

  'MMA / Boxing:Shoulders': ['Rotator cuff external rotation band 3x10', 'No heavy bag for 24hrs', 'Ice if acute 15min'],
  'MMA / Boxing:Arms': ['Forearm and wrist stretch protocol', 'Knuckle conditioning rest day', 'Ice hands if swollen 15min'],

  'Volleyball:Shoulders': ['Overhead load management — no spiking', 'Rotator cuff band circuit 3x15', 'Sleeper stretch 3x30sec'],
  'Volleyball:Knees': ['Patellar tendon management — decline squat 3x15', 'No jumping for 24hrs', 'Ice post activity 15min'],

  'Rowing:Back': ['McGill Big 3 — curl up, side plank, bird dog 3x8', 'No loaded rowing for 24hrs', 'Thoracic extension over foam roller'],
  'Rowing:Arms': ['Forearm flexor stretch 3x30sec', 'Reduce stroke rate next session', 'Massage gun on forearms 2min'],

  'Cycling:Quads': ['IT band foam roll 60sec each side', 'Hip flexor stretch 3x30sec', 'Reduce gear resistance next ride'],
  'Cycling:Knees': ['IT band and quad release', 'Bike fit check — saddle height', 'Low resistance spinning only'],

  'CrossFit:Back': ['McGill Big 3 mandatory — curl up, side plank, bird dog', 'No loaded flexion or deadlifts today', 'Deload — mobility only'],
  'CrossFit:Shoulders': ['No kipping movements today', 'Rotator cuff prehab 3x15', 'Band external rotations before next session'],
  'CrossFit:Quads': ['Foam roll quads and IT band', 'No heavy squats or box jumps for 24hrs', 'Eccentric step-downs 3x10'],

  'Gymnastics:Shoulders': ['Shoulder CARs 5 reps', 'No overhead or ring work today', 'Band pull-aparts 3x20'],
  'Gymnastics:Ankles': ['Ankle alphabet both directions', 'No tumbling today', 'Tape or brace for next session'],

  'Lacrosse:Shoulders': ['Rotator cuff band circuit', 'No throwing for 24hrs', 'Ice if acute 15min'],
  'Lacrosse:Knees': ['Lateral band walks 3x15', 'Single-leg balance drills', 'No cutting or pivoting today'],

  'Baseball:Shoulders': ['Rotator cuff external rotation band 3x15', 'No throwing for 24hrs — full rest', 'Sleeper stretch 3x30sec'],
  'Baseball:Arms': ['Forearm flexor stretch 3x30sec', 'Elbow flexor eccentric curls 3x10', 'Ice elbow 15min if tender'],

  'Softball:Shoulders': ['Rotator cuff protocol — band external rotation 3x15', 'No windmill pitching for 24hrs', 'Band pull-aparts 3x15'],

  'Cheerleading:Shoulders': ['No stunting today', 'Rotator cuff band circuit 3x15', 'Ice if acute 15min'],
  'Cheerleading:Knees': ['No tumbling or basing today', 'Patellar tendon management', 'Ice 15min post activity'],

  'Track & Field:Calves': ['Eccentric calf raises on step 3x15 slow', 'Avoid hills and track work for 48hrs', 'Compression socks during recovery'],
  'Track & Field:Ankles': ['Peroneal strengthening 3x15', 'Ankle alphabet exercises', 'Reduce mileage 30% next session'],
  'Track & Field:Hamstrings': ['Nordic curl progressions 3x6', 'Active isolated stretch 10 reps', 'No sprinting for 48hrs'],

  'Working Out:Chest': ['Doorway stretch 3x30sec', 'Light cable flys only', 'Push day rest — pull or legs instead'],
  'Working Out:Back': ['Lat stretch 3x30sec', 'Foam roller thoracic extensions', 'No heavy deadlifts or rows'],
  'Working Out:Arms': ['Forearm and bicep stretch protocol', 'Light pump work only', 'Ice elbows if tender 15min'],

  'Golf:Back': ['McGill Big 3 — curl up, side plank, bird dog', 'No full swing for 24hrs — chipping only', 'Heat pack lower back 15min'],
  'Golf:Shoulders': ['Shoulder CARs 5 reps', 'No driving range today', 'Posterior capsule stretch 3x30sec'],

  'Rugby:Neck': ['Isometric neck strengthening all directions 3x10', 'No contact today', 'See physio if persists 48hrs'],
  'Rugby:Shoulders': ['AC joint load management', 'No tackling drills', 'Band pull-aparts 3x15'],
  'Rugby:Knees': ['Lateral band walks 3x15', 'No scrummaging today', 'Ice 15min post activity'],

  'Dance:Ankles': ['Ankle alphabet both directions', 'Relevé eccentric control 3x15', 'No pointe work today'],
  'Dance:Knees': ['Patellar tracking exercises', 'No grand plié today', 'Ice 15min post activity'],
};

const RETURN_TO_PLAY = 'Return-to-play: Day 1 rest → Day 2 light movement → Day 3 sport-specific drills';
const STOP_TRAINING = 'Stop training this area and consult a sports medicine professional before your next session';

export function getRecoveryTips(muscle: string, sport?: string, score?: number): string[] {
  const key = sport ? `${sport}:${muscle}` : '';
  const base: string[] = (sport && SPORT_SPECIFIC_TIPS[key])
    ? [...SPORT_SPECIFIC_TIPS[key]]
    : [...(GENERIC_TIPS[muscle] ?? ['Rest and monitor', 'Stay hydrated'])];

  if ((score ?? 0) >= 5) base.push(RETURN_TO_PLAY);
  if ((score ?? 0) >= 7.5) base.push(STOP_TRAINING);

  return base;
}

export const SPORT_RECOVERY_RATE: Record<string, number> = {
  'MMA / Boxing': 1.3,
  CrossFit: 1.3,
  Football: 1.3,
  Rugby: 1.3,
  Wrestling: 1.3,
  Basketball: 1.15,
  Soccer: 1.15,
  Hockey: 1.15,
  Lacrosse: 1.15,
  'Track & Field': 1.15,
  Swimming: 1.0,
  Volleyball: 1.0,
  Tennis: 1.0,
  Rowing: 1.0,
  Gymnastics: 1.0,
  Baseball: 1.0,
  Softball: 1.0,
  Cheerleading: 1.0,
  Golf: 0.85,
  Dance: 0.85,
  Cycling: 0.85,
  'Working Out': 0.85,
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

// Decay weights per calendar day: index 0 = today, 1 = yesterday, …, 6 = 6 days ago
const DECAY_WEIGHTS = [1.0, 0.8, 0.65, 0.5, 0.4, 0.3, 0.2];

/**
 * Aggregates muscle stress scores across the last 7 days of logs.
 * More recent sessions carry higher weight via DECAY_WEIGHTS.
 * Each muscle score is capped at 10.
 */
export function computeScoresFromLogs(logs: SessionLog[]): Record<string, number> {
  const scores: Record<string, number> = {};
  MUSCLE_GROUPS.forEach((m) => {
    scores[m] = 0;
  });

  if (logs.length === 0) return scores;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  for (const log of logs) {
    const logDay = new Date(log.ts);
    logDay.setHours(0, 0, 0, 0);
    const dayIndex = Math.round((startOfTodayMs - logDay.getTime()) / (1000 * 60 * 60 * 24));
    if (dayIndex < 0 || dayIndex >= 7) continue;

    const weight = DECAY_WEIGHTS[dayIndex];
    const sportMultiplier = SPORT_RECOVERY_RATE[log.sport] ?? 1.0;
    const intensityFactor = log.intensity / 10;
    const durationFactor = Math.min(log.duration / 90, 1);
    const amplifier = (0.6 + intensityFactor * 0.8 + durationFactor * 0.6) * sportMultiplier;

    log.muscles.forEach((m) => {
      scores[m] = Math.min((scores[m] ?? 0) + 3 * amplifier * weight, 10);
    });
    log.painAreas.forEach((m) => {
      scores[m] = Math.min((scores[m] ?? 0) + log.painLevel * 0.8 * amplifier * weight, 10);
    });
  }

  return scores;
}
