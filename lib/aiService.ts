import { supabase } from '@/lib/supabase';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const REQUESTS_PER_DAY = 12;

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

const SYSTEM_PROMPT = `You are a sports medicine AI assistant for Actevix, an athlete health and injury risk tracking app.

Your role is to help athletes understand their muscle fatigue, injury risk, and recovery needs based on their logged workout data.

Guidelines:
- Speak with medical accuracy but in clear, simple language athletes can understand
- Always reference the athlete's actual data (fatigue scores, stressed muscles, sport) when provided
- Be concise — 3-5 sentences maximum per response
- Never diagnose medical conditions
- Never prescribe medications
- If pain level is 7 or higher out of 10, strongly recommend seeing a doctor or sports medicine professional immediately
- If injury risk is Critical, urge the athlete to rest and seek professional evaluation
- Suggest evidence-based recovery methods: rest, ice, compression, elevation, stretching, foam rolling, hydration, sleep
- Tailor advice to the athlete's sport when known
- Be encouraging but honest — never downplay serious symptoms
- End responses with a one-line actionable tip when possible

You are not a replacement for a doctor. Always remind athletes to consult a sports medicine professional for persistent or severe pain.`;

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
  sport?: string
): string {
  const top = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v > 0)
    .slice(0, 3);

  if (top.length === 0) {
    return 'The athlete has no recent workout data logged yet.';
  }

  const muscleList = top.map(([m, v]) => `${m} (${v.toFixed(1)}/10)`).join(', ');

  return `
Athlete data:
- Sport: ${sport || 'Not specified'}
- Overall fatigue score: ${overall.toFixed(1)}/10
- Injury risk level: ${risk.label}
- Most stressed muscles: ${muscleList}
  `.trim();
}

// ─── Main AI Query Function ───────────────────────────────────────────────────

export type AiQueryResult =
  | { success: true; response: string; remaining: number }
  | { success: false; error: string; remaining?: number };

export async function queryAI(
  query: string,
  scores: Record<string, number>,
  overall: number,
  risk: { label: string },
  sport?: string
): Promise<AiQueryResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Please log in to use AI insights.' };
    }

    const remaining = await getRemainingRequests(session.user.id);
    if (remaining <= 0) {
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      const hoursLeft = Math.ceil((tomorrow.getTime() - Date.now()) / 1000 / 60 / 60);
      return {
        success: false,
        error: `You've used all 12 AI insights for today. Resets in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.`,
        remaining: 0,
      };
    }

    const groqKey = getGroqKey();
    if (!groqKey) {
      return { success: false, error: 'AI service not configured. Check your API key.' };
    }

    const athleteContext = buildAthleteContext(scores, overall, risk, sport);

    const response = await fetch(GROQ_API_URL, {
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
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error?.message ?? 'AI service unavailable. Try again.' };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return { success: false, error: 'No response from AI. Try again.' };
    }

    await logRequest(session.user.id);

    return {
      success: true,
      response: text,
      remaining: remaining - 1,
    };
  } catch (e: any) {
    return { success: false, error: 'Connection error. Check your internet and try again.' };
  }
}