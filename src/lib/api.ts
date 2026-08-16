import {
  BirthDetails,
  KundaliBasicResponse,
  VimshottariResponse,
  CurrentDashaResponse,
  KpChartResponse,
  DivisionalResponse,
  ChartOutput,
  AscendantData,
  PlanetData,
  ZODIAC_SIGNS,
  VARGA_META,
} from "./types";
import { findCityLocal } from "./locations";
import { houseFromSign, signName, SIGN_LORD } from "./calculations";

const API_BASE = "/api/navamsha";

function buildBody(details: BirthDetails) {
  const [year, month, day] = details.date.split("-").map(Number);
  const [hours, minutes] = details.time.split(":").map(Number);
  return {
    year,
    month,
    date: day,
    hours,
    minutes,
    seconds: 0,
    latitude: details.latitude,
    longitude: details.longitude,
    timezone: details.timezone,
    settings: {
      ayanamsha: "lahiri",
      language: "en",
      observation_point: "topocentric",
    },
  };
}

async function post<T>(endpoint: string, details: BirthDetails): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBody(details)),
    });
  } catch (e) {
    throw new Error(
      `Network error (Failed to fetch). Is the Next.js server running? Start with: npm run dev\n` +
        `${e instanceof Error ? e.message : String(e)}`
    );
  }
  if (!res.ok) {
    const err = await res.text();
    if (res.status === 401) {
      throw new Error(
        `API key rejected (401). Get a free key at https://www.navamsha.in/auth/signup and set NAVAMSHA_API_KEY in .env.local, then restart npm run dev.\n${err}`
      );
    }
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function generateKundali(details: BirthDetails) {
  return post<KundaliBasicResponse>("kundali/basic", details);
}

export async function fetchVimshottariDasha(details: BirthDetails) {
  return post<VimshottariResponse>("dasha/vimshottari", details);
}

export async function fetchCurrentDasha(details: BirthDetails) {
  return post<CurrentDashaResponse>("dasha/current", details);
}

export async function fetchKpChart(details: BirthDetails) {
  return post<KpChartResponse>("kp/chart", details);
}

export async function fetchShodashvarga(details: BirthDetails) {
  return post<DivisionalResponse>("divisional/shodashvarga", details);
}

export async function fetchDivisional(details: BirthDetails, d: number) {
  return post<DivisionalResponse>(`divisional/d${d}`, details);
}

/** Current sky (transit) chart – uses kundali/basic with "now" (or supplied) datetime */
export async function fetchCurrentTransit(
  details: BirthDetails,
  asOf: Date = new Date()
): Promise<ChartOutput | null> {
  const y = asOf.getFullYear();
  const m = asOf.getMonth() + 1;
  const d = asOf.getDate();
  const h = asOf.getHours();
  const min = asOf.getMinutes();

  const transitDetails: BirthDetails = {
    ...details,
    date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    time: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
  };

  try {
    const raw = await post<KundaliBasicResponse>("kundali/basic", transitDetails);
    return normalizeChart(raw);
  } catch (e) {
    console.warn("[AstroKundli] Current transit fetch failed", e);
    return null;
  }
}

function signIndexFromName(name: unknown): number {
  if (typeof name !== "string") return 0;
  const idx = ZODIAC_SIGNS.findIndex((s) => s.toLowerCase() === name.trim().toLowerCase());
  return idx === -1 ? 0 : idx + 1;
}

function toDMS(degree: number) {
  const d = ((degree % 30) + 30) % 30;
  const degrees = Math.floor(d);
  const minutesFull = (d - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = Math.round((minutesFull - minutes) * 60);
  return { degrees, minutes, seconds, normDegree: d };
}

function findStrictChart(raw: unknown, depth = 0): ChartOutput | null {
  if (!raw || typeof raw !== "object" || depth > 5) return null;
  const o = raw as Record<string, unknown>;

  if (
    o.ascendant &&
    typeof o.ascendant === "object" &&
    o.planets &&
    typeof o.planets === "object" &&
    !Array.isArray(o.planets)
  ) {
    return o as ChartOutput;
  }

  for (const key of Object.keys(o)) {
    const val = o[key];
    if (val && typeof val === "object") {
      const found = findStrictChart(val, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function adaptLooseChart(node: Record<string, unknown>): ChartOutput | null {
  const ascSource = (node.ascendant ?? node.lagna ?? node.asc) as Record<string, unknown> | undefined;
  const planetsSource = node.planets ?? node.grahas ?? node.planet_positions;
  if (!planetsSource || typeof planetsSource !== "object") return null;

  const ascSignNum = ascSource
    ? typeof ascSource.sign === "string"
      ? signIndexFromName(ascSource.sign)
      : Number(ascSource.current_sign) || 0
    : 0;
  const ascDegreeVal = Number(ascSource?.degree ?? ascSource?.fullDegree ?? ascSource?.normDegree ?? 0);
  const ascDms = toDMS(ascDegreeVal);

  const ascendant: AscendantData = {
    current_sign: ascSignNum || 1,
    fullDegree: ascDegreeVal,
    normDegree: ascDms.normDegree,
    isRetro: "false",
    degrees: Number(ascSource?.degrees ?? ascDms.degrees),
    minutes: Number(ascSource?.minutes ?? ascDms.minutes),
    seconds: Number(ascSource?.seconds ?? ascDms.seconds),
    house_number: 1,
    localized_name: "Ascendant",
    zodiac_sign_name: (ascSource?.sign as string) || "",
    zodiac_sign_lord: "",
    nakshatra_number: 0,
    nakshatra_name: (ascSource?.nakshatra as string) || "",
    nakshatra_pada: Number(ascSource?.pada ?? 0),
    nakshatra_vimsottari_lord: (ascSource?.nakshatra_lord as string) || "",
  };

  const entries: [string, Record<string, unknown>][] = Array.isArray(planetsSource)
    ? (planetsSource as Record<string, unknown>[]).map((p) => [
        (p.name as string) || (p.planet as string) || "Unknown",
        p,
      ] as [string, Record<string, unknown>])
    : (Object.entries(planetsSource as Record<string, unknown>) as [string, Record<string, unknown>][]);

  const planets: Record<string, PlanetData> = {};
  entries.forEach(([name, p]) => {
    if (!p || typeof p !== "object") return;
    const sign = typeof p.sign === "string" ? signIndexFromName(p.sign) : Number(p.current_sign) || 0;
    const degreeVal = Number(p.degree ?? p.fullDegree ?? p.normDegree ?? 0);
    const dms = toDMS(degreeVal);
    const house = Number(p.house ?? p.house_number ?? (ascSignNum ? houseFromSign(sign || 1, ascSignNum) : 0));

    planets[name] = {
      current_sign: sign || 1,
      fullDegree: degreeVal,
      normDegree: dms.normDegree,
      isRetro: String(p.isRetro ?? p.retrograde ?? p.is_retrograde ?? "false"),
      degrees: Number(p.degrees ?? dms.degrees),
      minutes: Number(p.minutes ?? dms.minutes),
      seconds: Number(p.seconds ?? dms.seconds),
      house_number: house || 1,
      localized_name: name,
      zodiac_sign_name: (p.sign as string) || "",
      zodiac_sign_lord: "",
      nakshatra_number: 0,
      nakshatra_name: (p.nakshatra as string) || "",
      nakshatra_pada: Number(p.pada ?? 0),
      nakshatra_vimsottari_lord: (p.nakshatra_lord as string) || (p.star_lord as string) || "",
    };
  });

  if (Object.keys(planets).length === 0) return null;
  return { ascendant, planets };
}

const KNOWN_PLANET_KEYS = new Set([
  "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu",
  "uranus", "neptune", "pluto",
]);

function looksLikePlanetEntry(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.sign === "string" || typeof o.longitude === "number" || typeof o.house === "number";
}

function adaptFlatPlanetMap(node: Record<string, unknown>): ChartOutput | null {
  const planetEntries: [string, Record<string, unknown>][] = [];
  let ascSource: Record<string, unknown> | undefined;

  for (const [key, val] of Object.entries(node)) {
    if (!looksLikePlanetEntry(val)) continue;
    const lower = key.toLowerCase();
    if (lower === "ascendant" || lower === "asc" || lower === "lagna") {
      ascSource = val as Record<string, unknown>;
    } else if (KNOWN_PLANET_KEYS.has(lower)) {
      planetEntries.push([key, val as Record<string, unknown>]);
    }
  }

  if (planetEntries.length < 3) return null;

  let derivedAscSign = ascSource ? signIndexFromName(ascSource.sign as string) : 0;
  if (!derivedAscSign) {
    for (const [, p] of planetEntries) {
      const sign = signIndexFromName(p.sign as string);
      const house = Number(p.house ?? p.house_number);
      if (sign && house) {
        derivedAscSign = ((sign - 1 - (house - 1) + 24) % 12) + 1;
        break;
      }
    }
  }
  derivedAscSign = derivedAscSign || 1;

  const ascDegreeVal = Number(ascSource?.degree ?? ascSource?.longitude ?? 0);
  const ascDms = toDMS(ascDegreeVal);
  const ascendant: AscendantData = {
    current_sign: derivedAscSign,
    fullDegree: ascDegreeVal,
    normDegree: ascDms.normDegree,
    isRetro: "false",
    degrees: Number(ascSource?.degrees ?? ascDms.degrees),
    minutes: Number(ascSource?.minutes ?? ascDms.minutes),
    seconds: Number(ascSource?.seconds ?? ascDms.seconds),
    house_number: 1,
    localized_name: "Ascendant",
    zodiac_sign_name: (ascSource?.sign as string) || signName(derivedAscSign),
    zodiac_sign_lord: "",
    nakshatra_number: 0,
    nakshatra_name: (ascSource?.nakshatra as string) || "",
    nakshatra_pada: Number(ascSource?.pada ?? 0),
    nakshatra_vimsottari_lord: (ascSource?.nakshatra_lord as string) || "",
  };

  const planets: Record<string, PlanetData> = {};
  planetEntries.forEach(([name, p]) => {
    const sign = signIndexFromName(p.sign as string) || 0;
    const degreeVal = Number(p.longitude ?? p.degree ?? p.fullDegree ?? p.normDegree ?? 0);
    const dms = toDMS(degreeVal);
    const house = Number(p.house ?? p.house_number ?? (derivedAscSign ? houseFromSign(sign || 1, derivedAscSign) : 0));

    planets[name] = {
      current_sign: sign || 1,
      fullDegree: degreeVal,
      normDegree: dms.normDegree,
      isRetro: String(p.isRetro ?? p.retrograde ?? p.is_retrograde ?? "false"),
      degrees: Number(p.degrees ?? dms.degrees),
      minutes: Number(p.minutes ?? dms.minutes),
      seconds: Number(p.seconds ?? dms.seconds),
      house_number: house || 1,
      localized_name: name,
      zodiac_sign_name: (p.sign as string) || "",
      zodiac_sign_lord: "",
      nakshatra_number: 0,
      nakshatra_name: (p.nakshatra as string) || "",
      nakshatra_pada: Number(p.pada ?? 0),
      nakshatra_vimsottari_lord: (p.nakshatra_lord as string) || (p.star_lord as string) || "",
    };
  });

  return { ascendant, planets };
}

function findLooseChart(raw: unknown, depth = 0): ChartOutput | null {
  if (!raw || typeof raw !== "object" || depth > 5) return null;
  const o = raw as Record<string, unknown>;

  const adapted = adaptLooseChart(o) || adaptFlatPlanetMap(o);
  if (adapted) return adapted;

  for (const key of Object.keys(o)) {
    const val = o[key];
    if (val && typeof val === "object") {
      const found = findLooseChart(val, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

export function normalizeChart(raw: unknown): ChartOutput | null {
  return findStrictChart(raw) ?? findLooseChart(raw);
}

export async function fetchAllVargas(
  details: BirthDetails
): Promise<{ vargas: Record<string, ChartOutput>; failed: string[] }> {
  const result: Record<string, ChartOutput> = {};
  const wanted = VARGA_META.filter((v) => v.d !== 1);

  try {
    const bulk = await fetchShodashvarga(details);
    const output = (bulk?.output || {}) as Record<string, unknown>;
    for (const meta of wanted) {
      const candidates = [meta.key, meta.key.toUpperCase(), `D${meta.d}`, `d${meta.d}`, String(meta.d)];
      for (const key of candidates) {
        if (output[key] !== undefined) {
          const normalized = normalizeChart(output[key]);
          if (normalized) {
            result[meta.key] = normalized;
            break;
          }
        }
      }
    }
  } catch (e) {
    console.warn("[AstroKundli] Bulk shodashvarga fetch failed, falling back to per-chart calls", e);
  }

  const missing = wanted.filter((v) => !result[v.key]);
  if (missing.length) {
    const settled = await Promise.allSettled(missing.map((v) => fetchDivisional(details, v.d)));
    settled.forEach((res, i) => {
      const meta = missing[i];
      if (res.status === "fulfilled") {
        const normalized = normalizeChart(res.value.output);
        if (normalized) result[meta.key] = normalized;
      } else {
        console.warn(`[AstroKundli] ${meta.key} fetch failed:`, res.reason);
      }
    });
  }

  const failed = wanted.filter((v) => !result[v.key]).map((v) => v.key);
  return { vargas: result, failed };
}

export async function geocodePlace(
  place: string
): Promise<{ lat: number; lon: number; display: string } | null> {
  const local = findCityLocal(place);
  if (local) return local;
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(place.trim())}`);
    if (!res.ok) {
      const first = place.trim().split(/[\s,]+/)[0];
      return findCityLocal(first);
    }
    const data = await res.json();
    if (data?.results?.[0]) {
      return {
        lat: data.results[0].lat,
        lon: data.results[0].lon,
        display: data.results[0].display,
      };
    }
  } catch (e) {
    console.error("Geocode error", e);
  }
  return findCityLocal(place.trim().split(/[\s,]+/)[0]);
}

/* ------------------------------------------------------------------ */
/*  Relative Transit (from natal lagna) + Lagna Lord highlight         */
/* ------------------------------------------------------------------ */

export interface TransitRelativeResult {
  chart: ChartOutput;
  lagnaLord: string;
  lagnaLordTransitHouse: number | null;
  lagnaLordTransitSign: string;
  note: string;
}

/**
 * Re-houses transit planets from the natal lagna and highlights
 * where the natal lagna lord is currently travelling.
 */
export function makeRelativeTransit(
  natal: ChartOutput,
  transit: ChartOutput
): TransitRelativeResult | null {
  if (!natal?.ascendant || !transit?.planets) return null;

  const natalAsc = natal.ascendant.current_sign;
  const lagnaLord = SIGN_LORD[natalAsc] || "—";

  const planets: Record<string, PlanetData> = {};
  Object.entries(transit.planets).forEach(([name, p]) => {
    const house = houseFromSign(p.current_sign, natalAsc);
    planets[name] = {
      ...p,
      house_number: house,
    };
  });

  const relativeAsc: AscendantData = {
    ...natal.ascendant,
  };

  const relativeChart: ChartOutput = {
    ascendant: relativeAsc,
    planets,
  };

  const lordPlanet = planets[lagnaLord];
  const lagnaLordTransitHouse = lordPlanet?.house_number ?? null;
  const lagnaLordTransitSign = lordPlanet
    ? signName(lordPlanet.current_sign)
    : "—";

  return {
    chart: relativeChart,
    lagnaLord,
    lagnaLordTransitHouse,
    lagnaLordTransitSign,
    note:
      "Transit positions are current sky (Lahiri). Houses are counted from the natal lagna. " +
      "The lagna lord’s current house is especially useful for timing events related to the native’s overall vitality and direction.",
  };
}