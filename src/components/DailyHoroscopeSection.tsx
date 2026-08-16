"use client";

import { useEffect, useState, useCallback } from "react";

type TodayPayload = {
  ok?: boolean;
  date?: string;
  panchang?: any;
  advanced?: any;
  error?: string;
};

type HoroscopeReading = {
  general: string | null;
  mood?: string | null;
  color?: string | null;
  luckyNumber?: number | null;
  luckyTime?: string | null;
  compatibility?: string[];
  date?: string;
  loading?: boolean;
  error?: string | null;
};

const ZODIAC = [
  { id: "aries", name: "Aries", nameHi: "Mesh", symbol: "♈", element: "Fire", lord: "Mars" },
  { id: "taurus", name: "Taurus", nameHi: "Vrishabh", symbol: "♉", element: "Earth", lord: "Venus" },
  { id: "gemini", name: "Gemini", nameHi: "Mithun", symbol: "♊", element: "Air", lord: "Mercury" },
  { id: "cancer", name: "Cancer", nameHi: "Kark", symbol: "♋", element: "Water", lord: "Moon" },
  { id: "leo", name: "Leo", nameHi: "Simha", symbol: "♌", element: "Fire", lord: "Sun" },
  { id: "virgo", name: "Virgo", nameHi: "Kanya", symbol: "♍", element: "Earth", lord: "Mercury" },
  { id: "libra", name: "Libra", nameHi: "Tula", symbol: "♎", element: "Air", lord: "Venus" },
  { id: "scorpio", name: "Scorpio", nameHi: "Vrishchik", symbol: "♏", element: "Water", lord: "Mars" },
  { id: "sagittarius", name: "Sagittarius", nameHi: "Dhanu", symbol: "♐", element: "Fire", lord: "Jupiter" },
  { id: "capricorn", name: "Capricorn", nameHi: "Makar", symbol: "♑", element: "Earth", lord: "Saturn" },
  { id: "aquarius", name: "Aquarius", nameHi: "Kumbh", symbol: "♒", element: "Air", lord: "Saturn" },
  { id: "pisces", name: "Pisces", nameHi: "Meen", symbol: "♓", element: "Water", lord: "Jupiter" },
] as const;

type SignId = (typeof ZODIAC)[number]["id"];

const VALID_SIGNS = new Set<SignId>(ZODIAC.map((z) => z.id));

function formatField(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.length ? formatField(value[0]) : "—";

  const o = value as Record<string, unknown>;
  const name = o.name ?? o.Name ?? o.label ?? o.title ?? o.value ?? o.text;
  if (typeof name === "string" && name.trim()) {
    const parts: string[] = [];
    if (typeof o.paksha === "string") parts.push(o.paksha);
    parts.push(name.trim());
    if (o.number != null) parts.push(`(${o.number})`);
    const lord = typeof o.lord === "object" && o.lord ? (o.lord as any).name : o.lord;
    if (typeof lord === "string") parts.push(`· ${lord}`);
    return parts.join(" ");
  }
  return "—";
}

function findByKey(obj: any, hints: string[], depth = 0): unknown {
  if (!obj || typeof obj !== "object" || depth > 8) return null;
  const hs = hints.map((h) => h.toLowerCase());
  for (const [k, v] of Object.entries(obj)) {
    if (hs.some((h) => k.toLowerCase().includes(h)) && v != null) return v;
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") {
      const found = findByKey(v, hints, depth + 1);
      if (found != null) return found;
    }
  }
  return null;
}

export default function DailyHoroscopeSection() {
  const [data, setData] = useState<TodayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSign, setActiveSign] = useState<SignId>("aries");
  const [reading, setReading] = useState<HoroscopeReading>({ general: null });
  const [horoscopeCache, setHoroscopeCache] = useState<
    Record<string, HoroscopeReading>
  >({});

  // Fetch Panchang
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/today-vedic");
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setData({ ok: false, error: e?.message || "Network error" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch horoscope
  const fetchHoroscope = useCallback(
    async (signId: SignId) => {
      const safeSign: SignId = VALID_SIGNS.has(signId) ? signId : "aries";

      if (horoscopeCache[safeSign]?.general) {
        setReading(horoscopeCache[safeSign]);
        return;
      }

      setReading({ general: null, loading: true });

      try {
        const res = await fetch(
          `/api/horoscope?sign=${encodeURIComponent(safeSign)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!json.ok || !json.data) {
          throw new Error(json.error || "No horoscope data returned");
        }

        const d = json.data;
        const result: HoroscopeReading = {
          general: d.horoscope ?? null,
          mood: d.mood ?? null,
          color: d.color ?? null,
          luckyNumber: d.luckyNumber ?? null,
          luckyTime: d.luckyTime ?? null,
          compatibility: d.compatibility ?? [],
          loading: false,
          error: d.horoscope ? null : "No horoscope text returned",
        };

        setReading(result);
        setHoroscopeCache((prev) => ({ ...prev, [safeSign]: result }));
      } catch (e: any) {
        setReading({
          general: null,
          loading: false,
          error: e?.message || "Failed to load horoscope",
        });
      }
    },
    [horoscopeCache]
  );

  useEffect(() => {
    fetchHoroscope(activeSign);
  }, [activeSign, fetchHoroscope]);

  const pan =
    data?.advanced?.data ??
    data?.panchang?.data ??
    data?.panchang?.output ??
    data?.panchang ??
    data?.advanced ??
    data;

  const hasError = data?.error || data?.ok === false;
  const active = ZODIAC.find((z) => z.id === activeSign) ?? ZODIAC[0];

  return (
    <section className="relative max-w-7xl mx-auto px-3 sm:px-6 py-10 sm:py-14">
      {/* soft warm glow – matches hero */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[360px] w-[520px] sm:h-[440px] sm:w-[680px] rounded-full bg-gradient-to-b from-amber-100/60 via-orange-50/40 to-transparent blur-3xl" />
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 sm:py-28">
          <div className="h-10 w-10 sm:h-11 sm:w-11 animate-spin rounded-full border-2 border-amber-100 border-t-amber-500" />
          <p className="text-sm font-light tracking-wide text-amber-800/50">
            Loading cosmic data…
          </p>
        </div>
      )}

      {hasError && (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-5 py-4 sm:px-6 sm:py-5 text-sm text-rose-700">
          {data?.error || "Unable to load today’s guidance"}
        </div>
      )}

      {!loading && !hasError && (
        <div className="space-y-5 sm:space-y-6">
          {/* Zodiac selector */}
          <div className="overflow-x-auto rounded-2xl sm:rounded-3xl border border-amber-100/80 bg-white/80 p-2 shadow-sm backdrop-blur-xl scrollbar-none">
            <div className="flex min-w-max gap-1 sm:gap-1.5">
              {ZODIAC.map((z) => {
                const isActive = activeSign === z.id;
                return (
                  <button
                    key={z.id}
                    onClick={() => setActiveSign(z.id)}
                    className={`
                      group relative flex min-w-[64px] sm:min-w-[72px] flex-col items-center rounded-xl sm:rounded-2xl px-2 py-2.5 sm:px-2.5 sm:py-3
                      transition-all duration-300
                      ${
                        isActive
                          ? "bg-gradient-to-b from-amber-50 to-orange-50/80 shadow-sm ring-1 ring-amber-200/70"
                          : "hover:bg-amber-50/60 active:bg-amber-50/80"
                      }
                    `}
                  >
                    <div
                      className={`
                        flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full text-lg sm:text-xl
                        transition-all duration-300
                        ${
                          isActive
                            ? "bg-white text-amber-600 shadow-inner"
                            : "bg-amber-50/70 text-amber-700/60 group-hover:text-amber-600"
                        }
                      `}
                    >
                      {z.symbol}
                    </div>
                    <span
                      className={`
                        mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-medium tracking-wide
                        ${
                          isActive
                            ? "text-amber-800"
                            : "text-amber-800/50 group-hover:text-amber-800/80"
                        }
                      `}
                    >
                      {z.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Reading Card */}
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-100/80 bg-white/90 shadow-[0_20px_60px_-20px_rgba(180,83,9,0.08)] backdrop-blur-xl">
            {/* warm gradient accent bar */}
            <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

            <div className="p-5 sm:p-7 md:p-9">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 md:gap-6">
                {/* Symbol */}
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 shadow-inner mx-auto sm:mx-0">
                  <span className="text-3xl sm:text-4xl leading-none text-amber-600">
                    {active.symbol}
                  </span>
                </div>

                {/* Title + meta */}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-2 sm:gap-2.5">
                    <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-amber-950">
                      {active.name}
                    </h3>
                    <span className="text-base sm:text-lg text-amber-300">·</span>
                    <span className="text-base sm:text-lg font-medium text-amber-700">
                      {active.nameHi}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-sm text-amber-800/60">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {active.element}
                    </span>
                    <span className="hidden sm:inline text-amber-200">|</span>
                    <span>Lord {active.lord}</span>
                  </div>
                </div>
              </div>

              {/* Reading */}
              <div className="mt-6 sm:mt-7">
                <p className="mb-2.5 sm:mb-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600/60">
                  Today’s Reading
                </p>

                {reading.loading ? (
                  <div className="flex items-center gap-3 py-3 sm:py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
                    <span className="text-sm text-amber-700/50">Loading reading…</span>
                  </div>
                ) : reading.error ? (
                  <p className="text-sm text-rose-600">{reading.error}</p>
                ) : reading.general ? (
                  <p className="text-[15px] sm:text-[15.5px] font-light leading-relaxed text-amber-950/80">
                    {reading.general}
                  </p>
                ) : (
                  <p className="text-sm italic text-amber-700/40">
                    Horoscope text not available for this sign today.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}