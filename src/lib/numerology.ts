 
import { NumerologyProfile, calculateNumerology } from "@/lib/numerologys";

const BASE = process.env.NUMEROLOGY_API_BASE?.trim() || "https://api.numerologyapi.in";

interface NumerologyApiInput {
  name: string;
  date: string; // YYYY-MM-DD
}

function getApiKey(): string | null {
  const key = process.env.NUMEROLOGY_API_KEY?.trim();
  return key || null;
}

async function numerologyFetch(path: string, body: Record<string, unknown>) {
  const key = getApiKey();
  if (!key) return null;

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": key,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Numerology API ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

/**
 * Maps whatever shape the remote API returns into our internal
 * NumerologyProfile. Adjust this if your provider's response differs.
 */
function mapApiResponse(raw: any, fallback: NumerologyProfile): NumerologyProfile {
  if (!raw || typeof raw !== "object") return fallback;
  return {
    lifePath: raw.life_path_number ?? fallback.lifePath,
    destiny: raw.destiny_number ?? fallback.destiny,
    soulUrge: raw.soul_urge_number ?? fallback.soulUrge,
    personality: raw.personality_number ?? fallback.personality,
    birthDay: raw.birth_day_number ?? fallback.birthDay,
    expression: raw.expression_number ?? fallback.expression,
    maturity: raw.maturity_number ?? fallback.maturity,
    personalYear: raw.personal_year ?? fallback.personalYear,
    personalMonth: raw.personal_month ?? fallback.personalMonth,
    personalDay: raw.personal_day ?? fallback.personalDay,
    descriptions: {
      lifePath: raw.descriptions?.life_path ?? fallback.descriptions.lifePath,
      destiny: raw.descriptions?.destiny ?? fallback.descriptions.destiny,
      soulUrge: raw.descriptions?.soul_urge ?? fallback.descriptions.soulUrge,
      personality: raw.descriptions?.personality ?? fallback.descriptions.personality,
      birthDay: raw.descriptions?.birth_day ?? fallback.descriptions.birthDay,
      expression: raw.descriptions?.expression ?? fallback.descriptions.expression,
      maturity: raw.descriptions?.maturity ?? fallback.descriptions.maturity,
      personalYear: raw.descriptions?.personal_year ?? fallback.descriptions.personalYear,
    },
    compatibility: fallback.compatibility,
    years: fallback.years,
  };
}

/**
 * Returns a numerology profile for the given name + date of birth.
 * Always resolves — falls back to local calculation on any failure,
 * so callers never need a try/catch.
 */
export async function fetchNumerologyProfile(
  input: NumerologyApiInput
): Promise<NumerologyProfile> {
  const local = calculateNumerology(input.name, input.date);

  if (!getApiKey()) {
    return local;
  }

  try {
    const raw = await numerologyFetch("/api/v1/numerology/full-report", {
      name: input.name,
      date_of_birth: input.date,
    });
    return mapApiResponse(raw, local);
  } catch (e) {
    console.error("Numerology API failed, using local calculation:", e);
    return local;
  }
}