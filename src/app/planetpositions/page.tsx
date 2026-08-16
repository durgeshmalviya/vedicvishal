"use client";

import React, { useState, useEffect, useMemo } from "react";

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mars: "♂", Mercury: "☿", Jupiter: "♃",
  Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋",
  Uranus: "♅", Neptune: "♆", Pluto: "♇",
};

const ZODIAC: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const PLANETS = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter",
  "Venus", "Saturn", "Rahu", "Ketu", "Uranus", "Neptune", "Pluto",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Sample = {
  date: string;
  year: number;
  month: number;
  planets: Record<string, { sign: string; isRetro: boolean; degree: string }>;
};

type TransitRow = {
  planet: string;
  sign: string;
  from: string;
  to: string | null;
  nextSign: string | null;
  isRetro: boolean;
};

export default function YearTransitsPage() {
  const [currentLoading, setCurrentLoading] = useState(true);
  const [current, setCurrent] = useState<any>(null);
  const [currentSource, setCurrentSource] = useState<"cache" | "api" | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [meta, setMeta] = useState({ api: 0, cache: 0 });
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [activePlanet, setActivePlanet] = useState("Moon");
  const [view, setView] = useState<"now" | "year">("now");

  const startYear = new Date().getFullYear();
  const endYear = startYear + 1;
  const localKey = `year_transits_${startYear}_${endYear}`;

  useEffect(() => {
    loadCurrent();
    loadAll();
  }, []);

  async function loadCurrent() {
    setCurrentLoading(true);
    try {
      const res = await fetch("/api/planetpositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed");
      setCurrent(json.data);
      setCurrentSource(json.source);
    } catch (e: any) {
      console.error(e);
    } finally {
      setCurrentLoading(false);
    }
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      const cached = localStorage.getItem(localKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setSamples(parsed.samples || []);
        setMeta(parsed.meta || { api: 0, cache: 0 });
        setLoading(false);
        setProgress(100);
        return;
      }

      const start = new Date(startYear, 0, 1);
      const end = new Date(endYear, 11, 31);
      const allDates: string[] = [];
      const d = new Date(start);
      while (d <= end) {
        allDates.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 7);
      }

      const collected: Sample[] = [];
      let api = 0;
      let cache = 0;

      for (let i = 0; i < allDates.length; i++) {
        const dateStr = allDates[i];
        const [y, m, day] = dateStr.split("-").map(Number);
        const one = await fetch("/api/planetpositions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: y, month: m, date: day, hours: 12, minutes: 0,
            latitude: 28.6139, longitude: 77.209, timezone: 5.5,
          }),
        });
        const json = await one.json();
        if (!one.ok || json.error) continue;
        if (json.source === "api") api++;
        else cache++;

        const out = json.data?.output || {};
        const planets: Sample["planets"] = {};
        for (const name of PLANETS) {
          const p = out[name];
          if (!p) continue;
          planets[name] = {
            sign: p.zodiac_sign_name,
            isRetro: p.isRetro === true || p.isRetro === "true" || p.is_retrograde === true,
            degree: `${p.degrees}° ${p.minutes}′`,
          };
        }
        collected.push({ date: dateStr, year: y, month: m - 1, planets });
        setProgress(Math.round(((i + 1) / allDates.length) * 100));
        setMeta({ api, cache });
        if (i % 5 === 0) setSamples([...collected]);
      }

      setSamples(collected);
      setMeta({ api, cache });
      localStorage.setItem(localKey, JSON.stringify({ samples: collected, meta: { api, cache } }));
    } catch (e: any) {
      setError(e.message || "Failed");
    } finally {
      setLoading(false);
      setProgress(100);
    }
  }

  const yearTransits = useMemo(() => {
    const yearSamples = samples
      .filter((s) => s.year === activeYear)
      .sort((a, b) => a.date.localeCompare(b.date));
    const rows: TransitRow[] = [];
    for (const planet of PLANETS) {
      let prevSign: string | null = null;
      let fromDate: string | null = null;
      for (const s of yearSamples) {
        const p = s.planets[planet];
        if (!p) continue;
        if (prevSign === null) {
          prevSign = p.sign;
          fromDate = s.date;
          continue;
        }
        if (p.sign !== prevSign) {
          rows.push({
            planet, sign: prevSign, from: fromDate!, to: s.date, nextSign: p.sign, isRetro: false,
          });
          prevSign = p.sign;
          fromDate = s.date;
        }
      }
      if (prevSign && fromDate) {
        rows.push({
          planet, sign: prevSign, from: fromDate, to: null, nextSign: null,
          isRetro: yearSamples[yearSamples.length - 1]?.planets[planet]?.isRetro || false,
        });
      }
    }
    return rows;
  }, [samples, activeYear]);

  const activeData = useMemo(
    () => yearTransits.filter((r) => r.planet === activePlanet),
    [yearTransits, activePlanet]
  );

  const monthSnapshot = useMemo(() => {
    const inMonth = samples.filter(
      (s) => s.year === activeYear && s.month === activeMonth
    );
    if (!inMonth.length) return null;
    return inMonth[Math.floor(inMonth.length / 2)];
  }, [samples, activeYear, activeMonth]);

  const fmt = (d: string | null) => {
    if (!d) return "—";
    return new Date(d + "T12:00:00").toLocaleDateString(undefined, {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const output = current?.output || {};
  const ascendant = output.Ascendant;
  const retroList = PLANETS.filter((n) => {
    const p = output[n];
    return p && (p.isRetro === true || p.isRetro === "true" || p.is_retrograde === true);
  });

  return (
    <div className="min-h-screen bg-[#FFFBF5] font-sans text-gray-800 antialiased">


      <main className="mx-auto max-w-6xl px-4 pb-20 py-20">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3.5 py-1.5 text-xs font-medium text-amber-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Transits & Events
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="text-red-500">Planetary</span>{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Transits
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base text-gray-500 leading-relaxed">
            Explore Vedic Graha Gochar (Planetary Transits), sign changes, retrograde phases, and annual transit timelines using precise sidereal astrology calculations.
          </p>

          {/* Now / Year switch */}
          <div className="mt-8 inline-flex rounded-full border border-orange-100 bg-white p-1 shadow-sm">
            {(["now", "year"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${view === v
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200"
                    : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                {v === "now" ? "Right now" : "Year view"}
              </button>
            ))}
          </div>
        </div>

        {/* ========== NOW ========== */}
        {view === "now" && (
          <>
            {currentLoading ? (
              <div className="flex justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
              </div>
            ) : (
              <>
                {/* Metrics */}
                <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      label: "Ascendant",
                      value: ascendant
                        ? `${ZODIAC[ascendant.zodiac_sign_name]} ${ascendant.zodiac_sign_name}`
                        : "—",
                    },
                    {
                      label: "Moon",
                      value: output.Moon
                        ? `${ZODIAC[output.Moon.zodiac_sign_name]} ${output.Moon.zodiac_sign_name}`
                        : "—",
                    },
                    {
                      label: "Retrograde",
                      value: `${retroList.length}`,
                      sub: retroList.slice(0, 3).join(" · ") || "None",
                      accent: true,
                    },
                    { label: "System", value: "Vedic", sub: "Lahiri" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {m.label}
                      </p>
                      <p className={`mt-1 text-lg font-bold ${m.accent ? "text-red-500" : "text-gray-900"}`}>
                        {m.value}
                      </p>
                      {m.sub && (
                        <p className="mt-0.5 truncate text-xs text-gray-400">{m.sub}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ascendant feature */}
                {ascendant && (
                  <div className="mb-8 overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-[#FFF7ED] via-white to-[#FDF2F8] p-6 shadow-lg shadow-orange-100/40 sm:p-8">
                    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 text-4xl text-white shadow-xl shadow-orange-200/50">
                        {ZODIAC[ascendant.zodiac_sign_name]}
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                          Lagna · Rising
                        </p>
                        <h2 className="mt-1 text-3xl font-bold text-gray-900">
                          {ascendant.zodiac_sign_name}
                        </h2>
                        <p className="mt-1 font-mono text-sm text-gray-500">
                          {ascendant.degrees}° {ascendant.minutes}′ · {ascendant.nakshatra_name} P
                          {ascendant.nakshatra_pada}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Planet cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {PLANETS.map((name) => {
                    const p = output[name];
                    if (!p) return null;
                    const isRetro =
                      p.isRetro === true ||
                      p.isRetro === "true" ||
                      p.is_retrograde === true;

                    return (
                      <div
                        key={name}
                        className="rounded-2xl border border-orange-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-100/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7ED] text-xl ring-1 ring-orange-100">
                              {PLANET_SYMBOLS[name]}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{name}</p>
                              {p.house_number != null && (
                                <p className="text-[11px] text-gray-400">House {p.house_number}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-2xl text-gray-400">{ZODIAC[p.zodiac_sign_name]}</span>
                        </div>

                        <div className="mt-4 space-y-1.5 border-t border-orange-50 pt-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-xs">Sign</span>
                            <span className="font-semibold">{p.zodiac_sign_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-xs">Degree</span>
                            <span className="font-mono text-xs text-gray-600">
                              {p.degrees}° {p.minutes}′
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-xs">Nakshatra</span>
                            <span className="text-xs text-gray-600">
                              {p.nakshatra_name} · P{p.nakshatra_pada}
                            </span>
                          </div>
                        </div>

                        {isRetro && (
                          <div className="mt-3 rounded-xl bg-red-50 py-2 text-center text-[11px] font-bold tracking-wide text-red-600 ring-1 ring-red-100">
                            ℞ RETROGRADE
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ========== YEAR ========== */}
        {view === "year" && (
          <div className="space-y-8">
            {loading && (
              <div className="mx-auto max-w-sm rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="mb-2 flex justify-between text-xs text-gray-500">
                  <span>Loading {startYear}–{endYear}</span>
                  <span className="font-semibold text-orange-600">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-orange-50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-[11px] text-gray-400">
                  First load only · then instant from cache
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              <div className="inline-flex rounded-full border border-orange-100 bg-white p-1 shadow-sm">
                {[startYear, endYear].map((y) => (
                  <button
                    key={y}
                    onClick={() => setActiveYear(y)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeYear === y
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                        : "text-gray-500 hover:text-gray-800"
                      }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setActiveMonth(i)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeMonth === i
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-purple-50"
                      }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {monthSnapshot && (
              <div>
                <h3 className="mb-3 text-center text-sm font-bold text-gray-500">
                  {MONTHS[activeMonth]} {activeYear}
                </h3>
                <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-orange-50 bg-[#FFF7ED]/80 text-left text-[11px] uppercase tracking-wide text-gray-400">
                        <th className="px-4 py-3 font-semibold">Planet</th>
                        <th className="px-4 py-3 font-semibold">Sign</th>
                        <th className="px-4 py-3 font-semibold">Degree</th>
                        <th className="px-4 py-3 font-semibold">Motion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PLANETS.map((name) => {
                        const p = monthSnapshot.planets[name];
                        if (!p) return null;
                        return (
                          <tr key={name} className="border-b border-orange-50/80 hover:bg-orange-50/40">
                            <td className="px-4 py-2.5">
                              <span className="mr-2">{PLANET_SYMBOLS[name]}</span>
                              <span className="font-semibold">{name}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              {ZODIAC[p.sign]} {p.sign}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{p.degree}</td>
                            <td className="px-4 py-2.5">
                              {p.isRetro ? (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">℞</span>
                              ) : (
                                <span className="text-[10px] font-medium text-emerald-600">Direct</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {yearTransits.length > 0 && (
              <div className="space-y-5">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">Sign timeline</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a planet · periods in {activeYear}
                  </p>
                </div>

                <div className="overflow-x-auto pb-1">
                  <div className="flex w-max gap-1.5 rounded-2xl border border-orange-100 bg-white p-1.5 shadow-sm">
                    {PLANETS.map((planet) => (
                      <button
                        key={planet}
                        onClick={() => setActivePlanet(planet)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${activePlanet === planet
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                            : "text-gray-500 hover:bg-orange-50 hover:text-gray-800"
                          }`}
                      >
                        <span>{PLANET_SYMBOLS[planet]}</span>
                        {planet}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-lg shadow-orange-100/30">
                  <div className="flex items-center gap-4 border-b border-orange-100 bg-gradient-to-r from-[#FFFDF9] to-[#FFF7ED] px-5 py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-2xl text-white shadow-md">
                      {PLANET_SYMBOLS[activePlanet]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{activePlanet}</p>
                      <p className="text-xs text-gray-500">
                        {activeData.length} period{activeData.length !== 1 ? "s" : ""} · {activeYear}
                      </p>
                    </div>
                  </div>

                  <div className="max-h-[400px] overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-[#FFF7ED]">
                        <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
                          <th className="px-5 py-3 font-semibold">Sign</th>
                          <th className="px-5 py-3 font-semibold">From</th>
                          <th className="px-5 py-3 font-semibold">To</th>
                          <th className="px-5 py-3 font-semibold">Next</th>
                          <th className="px-5 py-3 text-center font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeData.map((r, i) => {
                          const now = new Date();
                          const fromDate = r.from ? new Date(r.from + "T12:00:00") : null;
                          const toDate = r.to ? new Date(r.to + "T12:00:00") : null;
                          const isCurrent =
                            fromDate && now >= fromDate && (toDate === null || now <= toDate);

                          return (
                            <tr
                              key={i}
                              className={`border-t border-orange-50 ${isCurrent ? "bg-orange-50/80" : "hover:bg-orange-50/40"
                                }`}
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-base">
                                    {ZODIAC[r.sign]}
                                  </span>
                                  <span className="font-semibold">{r.sign}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{fmt(r.from)}</td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                                {r.to ? fmt(r.to) : "Ongoing"}
                              </td>
                              <td className="px-5 py-3.5">
                                {r.nextSign ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                                    {ZODIAC[r.nextSign]} {r.nextSign}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                {isCurrent ? (
                                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    Now
                                  </span>
                                ) : toDate && toDate < now ? (
                                  <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
                                    Past
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-600">
                                    Next
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-center text-[11px] text-gray-400">
                  Weekly samples · Moon approximate · Outer planets move slowly
                </p>
              </div>
            )}
          </div>
        )}

       {/* ===== Luxury Footer Signature ===== */}
<div className="relative mt-20 overflow-hidden">
  {/* Ambient glow */}
  <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-300/20 via-orange-200/10 to-purple-300/20 blur-3xl animate-pulse" />

  {/* Floating particles */}
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute left-[18%] top-6 h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-duration:3.5s]" />
    <div className="absolute right-[22%] top-10 h-1 w-1 rounded-full bg-orange-400 animate-ping [animation-duration:4s]" />
    <div className="absolute left-[72%] bottom-8 h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-duration:5s]" />
  </div>

  <div className="relative flex flex-col items-center gap-5">
    {/* Ornamental divider */}
    <div className="flex items-center gap-4">
      <div className="h-px w-20 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/60 bg-gradient-to-br from-[#FFF8E7] to-[#F6E5B8] shadow-[0_0_30px_rgba(245,158,11,0.35)]">
        <div className="absolute inset-0 rounded-full border border-amber-300/40 animate-ping" />
        <span className="text-xl">☀</span>
      </div>
      <div className="h-px w-20 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
    </div>

    {/* Brand */}
    <div className="text-center">
      <h3 className="bg-gradient-to-r from-amber-700 via-orange-500 to-violet-600 bg-clip-text text-2xl md:text-3xl font-extrabold text-transparent tracking-tight">
        Vedic Kundli & Vedic Numerology
      </h3>

      <p className="mt-2 text-xs uppercase tracking-[0.45em] text-amber-700/80">
        Graha Gochar • Sidereal • Retrograde • Transit Windows
      </p>
    </div>

    {/* Premium glass badge */}
    <div className="group relative overflow-hidden rounded-full border border-amber-200/70 bg-white/60 backdrop-blur-xl px-6 py-3 shadow-[0_10px_40px_rgba(245,158,11,0.15)] transition-all duration-500 hover:scale-105 hover:shadow-[0_15px_50px_rgba(245,158,11,0.25)]">
      {/* Shimmer */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

      <div className="relative flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Real-Time Vedic Planetary Transits
      </div>
    </div>

    {/* Elegant caption */}
    <p className="max-w-lg text-center text-xs leading-relaxed text-gray-500">
      Ancient Vedic wisdom meets modern precision with accurate sidereal
      planetary movements, sign transitions, and transit insights.
    </p>
  </div>
</div>
      </main>
    </div>
  );
}