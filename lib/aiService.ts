import { supabase } from '@/lib/supabase';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const REQUESTS_PER_DAY = 12;
const FETCH_TIMEOUT_MS = 15_000;

// ─── Get API Key (works on both web and iOS simulator) ────────────────────────

import Constants from 'expo-constants';

function getGroqKey(): string {
  const envKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (envKey && envKey.length > 10) return envKey;
  const extraKey = Constants.expoConfig?.extra?.groqApiKey;
  if (extraKey && extraKey.length > 10) return extraKey;
  return '';
}

// ─── Medical System Prompt ────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Actevix AI, an intelligent sports medicine assistant built into the Actevix athlete health platform. You analyze workout data, fatigue scores, and injury risk to deliver personalized recovery guidance grounded in sports science.

TONE & STYLE
- Speak like a knowledgeable athletic trainer — confident, direct, and encouraging
- Use clear language; avoid jargon unless sport-specific context makes it natural
- Be concise: 3–5 sentences max. Never pad responses.
- Address the athlete by first name if provided

CLINICAL GUARDRAILS
- Never diagnose conditions or prescribe medications
- Pain ≥ 7/10 → explicitly recommend same-day evaluation by a sports medicine physician or athletic trainer
- Critical injury risk → instruct the athlete to stop training and seek professional evaluation before next session
- Persistent symptoms (>72h) → recommend in-person assessment
- Always close with: "Actevix AI is not a substitute for professional medical advice."

PERSONALIZATION (use all available context)
- Reference exact muscles stressed, fatigue scores, and risk levels by name
- Tailor recovery protocols to the athlete's specific sport biomechanics
  (e.g. rotator cuff loading in overhead athletes, ACL stress patterns in cutting sports, lumbar compression in rowers)
- Factor in session intensity, duration, and accumulated wear-and-tear trends when mentioned
- If multiple high-fatigue muscles overlap with known injury-prone zones for their sport, flag the pattern explicitly

EVIDENCE-BASED RECOVERY FRAMEWORK
Prioritize recommendations in this order based on severity:
1. Active rest / load management
2. Ice/compression (acute, <48h) or heat (chronic, >48h)
3. Sport-specific mobility and corrective movement
4. Soft tissue work: foam rolling, massage, trigger point release
5. Hydration, nutrition timing, sleep quality
6. Return-to-play progression when appropriate

END EVERY RESPONSE with a single bolded actionable tip relevant to the athlete's exact situation.`;

// ─── Result type ──────────────────────────────────────────────────────────────

export type AIErrorKind = 'offline' | 'rate_limit' | 'groq_down' | 'daily_limit';

export type AIResult =
  | { ok: true; insight: string; remaining: number }
  | { ok: false; error: AIErrorKind; remaining?: number };

// Keep the old name as an alias so existing callers compile without change.
export type AiQueryResult = AIResult;

// ─── Rate Limit Check ─────────────────────────────────────────────────────────

async function getRemainingRequests(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('ai_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString());

  const used = count ?? 0;
  return Math.max(0, REQUESTS_PER_DAY - used);
}

async function logRequest(userId: string): Promise<void> {
  await supabase.from('ai_requests').insert({ user_id: userId });
}

// ─── Build context from athlete data ─────────────────────────────────────────

function buildAthleteContext(
  scores: Record<string, number>,
  overall: number,
  risk: { label: string },
  sport?: string,
  recentSessions?: { workoutType: string; duration: number; intensity: number; muscles: string[]; painAreas: string[]; painLevel: number; painTypes?: string[]; painNote?: string; date: string }[]
): string {
  const top = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v > 0)
    .slice(0, 5);

  if (top.length === 0) return 'The athlete has no recent workout data logged yet.';

  const muscleList = top.map(([m, v]) => `${m} (${v.toFixed(1)}/10)`).join(', ');

  const painMap: Record<string, number[]> = {};
  recentSessions?.forEach(s => {
    if (s.painAreas.length > 0) {
      s.painAreas.forEach(area => {
        if (!painMap[area]) painMap[area] = [];
        painMap[area].push(s.painLevel);
      });
    }
  });
  const painSummary = Object.entries(painMap)
    .map(([area, levels]) => `${area} (avg pain ${(levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(1)}/10)`)
    .join(', ');

  // Most recent session pain detail — types + note elevate AI recovery urgency
  const latest = recentSessions?.[0];
  let latestPainDetail = '';
  if (latest && (latest.painTypes?.length || latest.painNote)) {
    const parts: string[] = [];
    if (latest.painTypes?.length) parts.push(latest.painTypes.join(', '));
    if (latest.painAreas?.length) parts.push(`in ${latest.painAreas.join(', ')}`);
    if (latest.painNote) parts.push(`— "${latest.painNote}"`);
    latestPainDetail = `Reported pain: ${parts.join(' ')}`;
  }

  const sessionSummary = recentSessions?.slice(0, 3).map(s =>
    `${s.workoutType} — ${s.duration}min, intensity ${s.intensity}/10`
  ).join(' | ');

  return `
Athlete data:
- Sport: ${sport || 'Not specified'}
- Overall fatigue score: ${overall.toFixed(1)}/10
- Injury risk level: ${risk.label}
- Most stressed muscles: ${muscleList}
${painSummary ? `- Active pain/soreness: ${painSummary}` : '- No reported pain areas'}
${latestPainDetail ? `- Latest session pain detail: ${latestPainDetail}` : ''}
${sessionSummary ? `- Recent sessions: ${sessionSummary}` : ''}
  `.trim();
}

// ─── Main AI Query Function ───────────────────────────────────────────────────

export async function queryAI(
  query: string,
  scores: Record<string, number>,
  overall: number,
  risk: { label: string },
  sport?: string,
  recentSessions?: { workoutType: string; duration: number; intensity: number; muscles: string[]; painAreas: string[]; painLevel: number; painTypes?: string[]; painNote?: string; date: string }[]
): Promise<AIResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { ok: false, error: 'groq_down' };
    }

    const remaining = await getRemainingRequests(session.user.id);
    if (remaining <= 0) {
      return { ok: false, error: 'daily_limit', remaining: 0 };
    }

    const groqKey = getGroqKey();
    if (!groqKey) {
      return { ok: false, error: 'groq_down' };
    }

    const athleteContext = buildAthleteContext(scores, overall, risk, sport, recentSessions);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 200,
          temperature: 0.5,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: `${athleteContext}\n\nAthlete question: ${query}`,
            },
          ],
        }),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      // AbortError = timeout; TypeError with "network" = no connection
      const isNetworkError =
        fetchErr?.name === 'AbortError' ||
        fetchErr?.name === 'TypeError' ||
        fetchErr?.message?.toLowerCase().includes('network') ||
        fetchErr?.message?.toLowerCase().includes('failed to fetch');
      return { ok: false, error: isNetworkError ? 'offline' : 'groq_down' };
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 429) {
      return { ok: false, error: 'rate_limit', remaining };
    }

    if (!response.ok) {
      return { ok: false, error: 'groq_down', remaining };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return { ok: false, error: 'groq_down', remaining };
    }

    await logRequest(session.user.id);

    return { ok: true, insight: text, remaining: remaining - 1 };
  } catch {
    return { ok: false, error: 'offline' };
  }
}
