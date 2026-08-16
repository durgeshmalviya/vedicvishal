"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PanchangData {
  source: "cache" | "api";
  date: string;
  location: string;
  daily: any;
  choghadiya: any;
  hora: any;
  muhurat?: any;
  gochar?: any;
  gochar_insights?: any;
}

export default function PanchangPage() {
  const [data, setData] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/panchang");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getDaily = (key: string) => {
    const d = data?.daily;
    if (!d) return "—";
    if (typeof d[key] === "string") return d[key];
    return d[key]?.name || d[key] || "—";
  };

  const choghadiyaPeriods =
    data?.choghadiya?.periods ||
    data?.choghadiya?.day ||
    (Array.isArray(data?.choghadiya) ? data.choghadiya : []) ||
    [];

  const horaPeriods =
    data?.hora?.periods ||
    data?.hora?.day ||
    data?.hora?.horas ||
    (Array.isArray(data?.hora) ? data.hora : []) ||
    [];

  const muhuratWindows = data?.muhurat?.windows || [];
  const gocharWindows = data?.gochar?.windows || [];
  const insights =
    data?.gochar_insights?.importance ||
    data?.gochar_insights?.facts ||
    [];

  const badgeClass = (name: string = "") => {
    const n = name.toLowerCase();
    if (
      n.includes("amrit") ||
      n.includes("amrut") ||
      n.includes("shubh") ||
      n.includes("shoobh") ||
      n.includes("labh") ||
      n.includes("laabh") ||
      n.includes("auspicious")
    )
      return "bg-green-100 text-green-700 border-green-200";
    if (
      n.includes("rog") ||
      n.includes("kaal") ||
      n.includes("udveg") ||
      n.includes("inauspicious")
    )
      return "bg-red-100 text-red-700 border-red-200";
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  const fmtTime = (v: any) => {
    if (!v || v === "—") return "—";
    const s = String(v);

    if (s.includes("T")) {
      try {
        return new Date(s).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      } catch {
        return s.slice(0, 16);
      }
    }

    // "25:47:47" → next-day clock
    const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      let h = parseInt(m[1], 10);
      const min = m[2];
      const dayOffset = Math.floor(h / 24);
      h = h % 24;
      const label = `${String(h).padStart(2, "0")}:${min}`;
      return dayOffset > 0 ? `${label} (+${dayOffset}d)` : label;
    }

    return s;
  };

  const fmtRange = (start: any, end: any) => {
    if (!start && !end) return null;
    return `${fmtTime(start)} → ${fmtTime(end)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E7] via-[#FFF3D6] to-[#FFE8B8]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-20 h-2 w-2 rounded-full bg-orange-300/40" />
        <div className="absolute right-20 top-40 h-3 w-3 rounded-full bg-amber-300/30" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-orange-700 shadow-sm">
              <span>🕉️</span>
              <span>Daily Vedic Calendar</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-[#E11D48]">Vedic</span>{" "}
              <span className="text-[#EA580C]">Panchang</span>
            </h1>
            <p className="mt-1 text-amber-900/70">
              {today} · {data?.location || "Bhopal"} ·{" "}
              <span className="text-amber-700/60">
                {data?.source === "cache" ? "Cached" : "Live"}
              </span>
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-2.5 text-sm font-medium text-amber-900 shadow-sm transition hover:bg-orange-50"
          >
            ← Back to Home
          </Link>
        </header>

        {loading && (
          <div className="flex h-64 items-center justify-center text-lg text-amber-800/70">
            Loading today&apos;s Panchang… (first load may take ~12s)
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-white/70 px-6 py-10 text-center text-red-600">
            {error}
          </div>
        )}

        {data && !loading && !error && (
          <div className="space-y-6">
            {/* Daily + Choghadiya + Hora */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <section className="lg:col-span-4">
                <div className="h-full rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-sm text-orange-600">
                      ☀
                    </span>
                    Daily Panchang
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Tithi", value: getDaily("tithi") },
                      { label: "Nakshatra", value: getDaily("nakshatra") },
                      { label: "Yoga", value: getDaily("yoga") },
                      { label: "Karana", value: getDaily("karana") },
                      { label: "Paksha", value: getDaily("paksha") },
                      { label: "Ritu / Month", value: getDaily("ritu") },
                      { label: "Sunrise", value: getDaily("sunrise") },
                      { label: "Sunset", value: getDaily("sunset") },
                      { label: "Rahu Kalam", value: getDaily("rahu_kalam") },
                      { label: "Weekday", value: getDaily("weekday") },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 px-3 py-2.5"
                      >
                        <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700/70">
                          {item.label}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="lg:col-span-4">
                <div className="h-full rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-sm text-violet-600">
                      ⏱
                    </span>
                    Choghadiya
                  </h2>
                  {choghadiyaPeriods.length === 0 ? (
                    <p className="text-sm text-gray-500">No data</p>
                  ) : (
                    <div className="max-h-[340px] overflow-auto rounded-2xl border border-orange-100">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-orange-50/90">
                          <tr className="border-b border-orange-100 text-[11px] uppercase tracking-wide text-amber-800/70">
                            <th className="px-3 py-2.5 font-medium">Period</th>
                            <th className="px-3 py-2.5 font-medium">Time</th>
                            <th className="px-3 py-2.5 font-medium text-right">
                              Type
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-50">
                          {choghadiyaPeriods.map((p: any, i: number) => (
                            <tr key={i} className="hover:bg-orange-50/40">
                              <td className="px-3 py-2 font-medium text-gray-900">
                                {p.name || p.type || "—"}
                                {p.section && (
                                  <span className="ml-1.5 text-[10px] text-amber-700/50">
                                    {p.section}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-amber-800/70">
                                {fmtTime(p.start || p.start_time)} –{" "}
                                {fmtTime(p.end || p.end_time)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span
                                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeClass(
                                    p.name || p.type
                                  )}`}
                                >
                                  {p.name || p.type || "—"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

              <section className="lg:col-span-4">
                <div className="h-full rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-sm text-amber-600">
                      🪐
                    </span>
                    Planetary Hora
                  </h2>
                  {horaPeriods.length === 0 ? (
                    <p className="text-sm text-gray-500">No data</p>
                  ) : (
                    <div className="max-h-[340px] overflow-auto rounded-2xl border border-orange-100">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-orange-50/90">
                          <tr className="border-b border-orange-100 text-[11px] uppercase tracking-wide text-amber-800/70">
                            <th className="px-3 py-2.5 font-medium">Planet</th>
                            <th className="px-3 py-2.5 font-medium text-right">
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-50">
                          {horaPeriods.map((h: any, i: number) => (
                            <tr key={i} className="hover:bg-orange-50/40">
                              <td className="px-3 py-2 font-medium text-gray-900">
                                {h.planet || h.lord || h.name || "—"}
                              </td>
                              <td className="px-3 py-2 text-right text-amber-800/70">
                                {fmtTime(h.start || h.start_time)} –{" "}
                                {fmtTime(h.end || h.end_time)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Muhurat */}
            <section className="rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-600">
                  ✨
                </span>
                Auspicious Muhurat (General Work)
              </h2>
              {muhuratWindows.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {data.muhurat?.error
                    ? `API: ${data.muhurat.error}`
                    : "No muhurat windows in the next 3 days."}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-orange-100">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-orange-100 bg-orange-50/60 text-[11px] uppercase tracking-wide text-amber-800/70">
                        <th className="px-3 py-2.5 font-medium">Date</th>
                        <th className="px-3 py-2.5 font-medium">Start</th>
                        <th className="px-3 py-2.5 font-medium">End</th>
                        <th className="px-3 py-2.5 font-medium">Score</th>
                        <th className="px-3 py-2.5 font-medium">Quality</th>
                        <th className="px-3 py-2.5 font-medium">Tithi</th>
                        <th className="px-3 py-2.5 font-medium">Nakshatra</th>
                        <th className="px-3 py-2.5 font-medium">Reasons</th>
                        <th className="px-3 py-2.5 font-medium">Warnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                      {muhuratWindows.map((w: any, i: number) => (
                        <tr key={i} className="hover:bg-orange-50/40">
                          <td className="px-3 py-2 text-gray-800">{w.date}</td>
                          <td className="px-3 py-2 text-amber-800/80">
                            {fmtTime(w.start_time || w.start)}
                          </td>
                          <td className="px-3 py-2 text-amber-800/80">
                            {fmtTime(w.end_time || w.end)}
                          </td>
                          <td className="px-3 py-2 font-semibold text-gray-900">
                            {w.score}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeClass(
                                w.quality
                              )}`}
                            >
                              {w.quality}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-800">{w.tithi}</td>
                          <td className="px-3 py-2 text-gray-800">
                            {w.nakshatra}
                          </td>
                          <td className="max-w-[160px] px-3 py-2 text-xs text-amber-900/70">
                            {w.reasons}
                          </td>
                          <td className="max-w-[140px] px-3 py-2 text-xs text-rose-600/80">
                            {w.warnings}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Gochar + Insights */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <section className="rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sm text-sky-600">
                    🔭
                  </span>
                  Gochar Timeline
                </h2>
                <p className="mb-4 text-xs text-amber-800/50">
                  {data.gochar?.note || "Demo natal"}
                </p>
                {gocharWindows.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {data.gochar?.error
                      ? `API: ${data.gochar.error}`
                      : "No gochar data."}
                  </p>
                ) : (
                  <div className="max-h-[280px] overflow-auto rounded-2xl border border-orange-100">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-orange-50/90">
                        <tr className="border-b border-orange-100 text-[11px] uppercase tracking-wide text-amber-800/70">
                          <th className="px-3 py-2.5 font-medium">Event</th>
                          <th className="px-3 py-2.5 font-medium">Start</th>
                          <th className="px-3 py-2.5 font-medium">End</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-50">
                        {gocharWindows.slice(0, 30).map((g: any, i: number) => (
                          <tr key={i} className="hover:bg-orange-50/40">
                            <td className="px-3 py-2">
                              <p className="font-medium text-gray-900">
                                {g.title}
                              </p>
                              {g.summary && (
                                <p className="mt-0.5 line-clamp-1 text-xs text-amber-800/60">
                                  {g.summary}
                                </p>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-amber-800/70">
                              {fmtTime(g.start)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-amber-800/70">
                              {fmtTime(g.end)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-sm text-indigo-600">
                    📜
                  </span>
                  Gochar Insights
                </h2>
                <p className="mb-4 text-xs text-amber-800/50">
                  {data.gochar_insights?.note || "Ranked facts"}
                </p>
                {insights.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {data.gochar_insights?.error
                      ? `API: ${data.gochar_insights.error}`
                      : "No insights available."}
                  </p>
                ) : (
                  <div className="max-h-[280px] space-y-2 overflow-auto">
                    {insights.slice(0, 12).map((f: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50/80 to-amber-50/50 px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {f.title}
                          </p>
                          {f.rank != null && (
                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                              #{f.rank}
                            </span>
                          )}
                        </div>
                        {(f.start || f.end) && (
                          <p className="mt-1 text-xs font-medium text-amber-800/80">
                            {fmtRange(f.start, f.end)}
                          </p>
                        )}
                        {f.summary && (
                          <p className="mt-1 line-clamp-2 text-xs text-amber-900/70">
                            {f.summary}
                          </p>
                        )}
                        {f.category && (
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-amber-700/50">
                            {f.category}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <p className="text-center text-sm text-amber-800/50">
              Data source:{" "}
              {data.source === "cache" ? "Cached (1 fetch/day)" : "Live API"} ·{" "}
              {data.location} · FreeAstroAPI
            </p>
          </div>
        )}
      </div>
    </div>
  );
}