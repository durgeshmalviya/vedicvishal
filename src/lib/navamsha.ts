// src/lib/navamsha.ts
const BASE = "https://api.navamsha.in";

const DEFAULT_PLACE = {
  latitude: 28.6139,
  longitude: 77.209,
  timezone: 5.5,
};

function getApiKey(): string {
  const key = process.env.NAVAMSHA_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "NAVAMSHA_API_KEY is missing. Add it to .env.local and restart the server."
    );
  }
  return key;
}

/** Calendar parts in Asia/Kolkata → YYYY-MM-DD */
function istDateString(dateStr?: string): string {
  if (dateStr) return dateStr; // assume already YYYY-MM-DD
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

async function navamshaFetch(path: string, init?: RequestInit) {
  const key = getApiKey();

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": key,          // official header
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Navamsha ${path} → ${res.status}: ${text.slice(0, 400)}`
    );
  }
  return res.json();
}

export async function fetchTodayPanchang(opts?: {
  lat?: number;
  lon?: number;
  timezone?: number;
  date?: string; // YYYY-MM-DD
}) {
  const lat = opts?.lat ?? DEFAULT_PLACE.latitude;
  const lon = opts?.lon ?? DEFAULT_PLACE.longitude;
  const tz = opts?.timezone ?? DEFAULT_PLACE.timezone;
  const date = istDateString(opts?.date);

  // Primary documented endpoint
  const qs = new URLSearchParams({
    date,
    latitude: String(lat),
    longitude: String(lon),
    timezone: String(tz),
  });

  try {
    return await navamshaFetch(`/api/v1/panchang/daily?${qs}`);
  } catch (firstErr: any) {
    // Optional fallbacks if their API surface changes
    const body = {
      date: Number(date.split("-")[2]),
      month: Number(date.split("-")[1]),
      year: Number(date.split("-")[0]),
      hours: 12,
      minutes: 0,
      seconds: 0,
      timezone: tz,
      latitude: lat,
      longitude: lon,
      settings: {
        ayanamsha: "lahiri",
        language: "en",
        observation_point: "topocentric",
      },
    };

    const attempts = [
      () =>
        navamshaFetch("/api/v1/astrology/panchang", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      () =>
        navamshaFetch("/api/v1/astrology/panchang/advanced", {
          method: "POST",
          body: JSON.stringify(body),
        }),
    ];

    const errors = [String(firstErr?.message || firstErr)];
    for (const run of attempts) {
      try {
        return await run();
      } catch (e: any) {
        errors.push(e?.message || String(e));
      }
    }
    throw new Error(`Navamsha Panchang failed:\n${errors.join("\n")}`);
  }
}

// Keep auspicious / inauspicious similar, or drop if they also 401
export async function fetchAuspiciousPeriod(opts?: {
  lat?: number;
  lon?: number;
  timezone?: number;
  date?: string;
}) {
  // same pattern as above if you still need them
  // ...
}