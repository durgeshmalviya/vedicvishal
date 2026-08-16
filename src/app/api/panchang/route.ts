import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const API_KEY =
  process.env.FREE_ASTRO_API_KEY ||
  "1a5eda5cd8b56766dae7fc0f1fdd44deeb10ab031999044f631c1b254ac9b195";

const BASE = "https://api.freeastroapi.com";
const DELAY_MS = 1600;

/** Bhopal, Madhya Pradesh */
const DEFAULT = {
  latitude: 23.2599,
  longitude: 77.4126,
  location: "Bhopal",
  tz_str: "Asia/Kolkata",
};

/** Demo natal for Gochar — replace with real birth later */
const DEMO_NATAL = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 10,
  minute: 30,
  city: "Bhopal",
  lat: 23.2599,
  lng: 77.4126,
  tz_str: "Asia/Kolkata",
  ayanamsha: "lahiri",
  house_system: "whole_sign",
  node_type: "mean",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function addDays(isoDate: string, days: number) {
  const d = new Date(isoDate + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function humanizeGocharKind(kind: string) {
  if (!kind) return "Event";
  return kind
    .replace(/^gochar_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function pickTime(obj: any, keys: string[]) {
  if (!obj) return null;
  for (const k of keys) {
    if (obj[k]) return obj[k];
  }
  return null;
}

async function callFreeAstro(
  path: string,
  body: Record<string, any>,
  retries = 3
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return res.json();

    const text = await res.text();

    if (res.status === 429 && attempt < retries) {
      let waitMs = DELAY_MS * (attempt + 1);
      try {
        const j = JSON.parse(text);
        if (j.retry_after_ms) waitMs = Math.max(waitMs, j.retry_after_ms + 300);
      } catch {
        /* ignore */
      }
      console.warn(`[429] ${path} — retry in ${waitMs}ms (attempt ${attempt + 1})`);
      await sleep(waitMs);
      continue;
    }

    throw new Error(`${path} failed (${res.status}): ${text.slice(0, 500)}`);
  }

  throw new Error(`${path} failed after retries`);
}

async function callSoft(path: string, body: Record<string, any>) {
  try {
    return await callFreeAstro(path, body);
  } catch (e: any) {
    console.warn("[soft]", path, e.message);
    return { __error: e.message };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];
    const force = searchParams.get("force") === "1";

    // Cache (skip if force or old cache without muhurat)
    if (!force) {
      const { data: cached } = await supabaseAdmin
        .from("panchang_cache")
        .select("*")
        .eq("date", date)
        .maybeSingle();

      if (cached && cached.muhurat != null) {
        return NextResponse.json({
          source: "cache",
          date,
          location: cached.location || DEFAULT.location,
          daily: cached.daily,
          choghadiya: cached.choghadiya,
          hora: cached.hora,
          muhurat: cached.muhurat,
          gochar: cached.gochar ?? null,
          gochar_insights: cached.gochar_insights ?? null,
        });
      }
    }

    const [year, month, day] = date.split("-").map(Number);

    const commonBody = {
      year,
      month,
      day,
      hour: 12,
      minute: 0,
      lat: DEFAULT.latitude,
      lng: DEFAULT.longitude,
      city: DEFAULT.location,
      tz_str: DEFAULT.tz_str,
      ayanamsha: "lahiri",
    };

    // Sequential calls (1 RPS)
    const dailyRaw = await callFreeAstro("/api/v2/vedic/panchang", commonBody);
    await sleep(DELAY_MS);

    const choghadiyaRaw = await callFreeAstro("/api/v2/vedic/qa", {
      ...commonBody,
      question: "chaughadia",
      date,
      time: "12:00",
    });
    await sleep(DELAY_MS);

    const horaRaw = await callFreeAstro("/api/v2/vedic/qa", {
      ...commonBody,
      question: "hora",
      date,
      time: "12:00",
    });
    await sleep(DELAY_MS);

    const muhuratRaw = await callSoft("/api/v2/vedic/muhurat/search", {
      purpose: "general_work",
      start_date: date,
      end_date: addDays(date, 2),
      lat: DEFAULT.latitude,
      lng: DEFAULT.longitude,
      city: DEFAULT.location,
      tz_str: DEFAULT.tz_str,
      ayanamsha: "lahiri",
      language: "en",
      limit: 10,
    });
    await sleep(DELAY_MS);

    const gocharBody = {
      ...DEMO_NATAL,
      range_start: date,
      range_end: addDays(date, 2),
      transit_hour: 12,
      transit_minute: 0,
      transit_tz_str: DEFAULT.tz_str,
      transit_planets: ["saturn", "jupiter", "rahu", "ketu", "mars"],
      include_dasha_overlay: false,
    };

    const gocharRaw = await callSoft("/api/v2/vedic/gochar/timeline", gocharBody);
    await sleep(DELAY_MS);

    const gocharInsightsRaw = await callSoft(
      "/api/v2/vedic/gochar/timeline/insights",
      gocharBody
    );

    // ---------- Daily ----------
    const daily = {
      tithi: dailyRaw.tithi?.name
        ? `${dailyRaw.tithi.name} (${dailyRaw.tithi.paksha || ""})`
        : dailyRaw.request_time_panchang?.tithi?.name || "—",
      nakshatra: dailyRaw.nakshatra?.name
        ? `${dailyRaw.nakshatra.name} (Pada ${dailyRaw.nakshatra.pada || "—"})`
        : dailyRaw.request_time_panchang?.nakshatra?.name || "—",
      yoga:
        dailyRaw.yoga?.name ||
        dailyRaw.request_time_panchang?.yoga?.name ||
        "—",
      karana:
        dailyRaw.karanas?.[0]?.name ||
        dailyRaw.request_time_panchang?.karana?.name ||
        "—",
      paksha:
        dailyRaw.tithi?.paksha ||
        dailyRaw.request_time_panchang?.tithi?.paksha ||
        "—",
      ritu: dailyRaw.lunar_month?.name || "—",
      sunrise: dailyRaw.sunrise || "—",
      sunset: dailyRaw.sunset || "—",
      moonrise: "—",
      moonset: "—",
      rahu_kalam: dailyRaw.rahu_kalam
        ? `${dailyRaw.rahu_kalam.start} – ${dailyRaw.rahu_kalam.end}`
        : "—",
      weekday: dailyRaw.weekday?.name || "—",
    };

    const choghadiyaPeriods = [
      ...(choghadiyaRaw.sections?.day || []),
      ...(choghadiyaRaw.sections?.night || []),
    ].map((p: any) => ({
      name: p.name,
      type: p.name,
      start: p.start_time || p.start,
      end: p.end_time || p.end,
      quality: p.quality,
      section: p.section,
    }));

    const horaPeriods = (
      horaRaw.periods ||
      horaRaw.sections?.day ||
      horaRaw.sections?.night ||
      []
    ).map((h: any) => ({
      planet: h.name || h.planet || h.lord || "—",
      lord: h.name || h.planet || h.lord || "—",
      start: h.start_time || h.start,
      end: h.end_time || h.end,
    }));

    // ---------- Muhurat ----------
    let muhuratWindows: any[] = [];
    let muhuratError: string | null = null;

    if (muhuratRaw?.__error) {
      muhuratError = muhuratRaw.__error;
    } else if (muhuratRaw?.best_windows?.length) {
      muhuratWindows = muhuratRaw.best_windows.map((w: any) => {
        const c = w.criteria || {};
        const avoid = c.avoid_periods || [];
        const warningsArr = [
          ...(w.warnings || []),
          ...avoid.map((a: any) =>
            a.name ? `${a.name}${a.status ? ` (${a.status})` : ""}` : null
          ),
        ].filter(Boolean);

        return {
          date: w.date || "—",
          start: w.start || "—",
          end: w.end || "—",
          start_time: w.start_time || null,
          end_time: w.end_time || null,
          score: w.score ?? "—",
          quality: w.quality || "—",
          purpose: c.purpose?.label || muhuratRaw.purpose || "General Work",
          tithi: c.tithi?.value || c.tithi?.name || "—",
          nakshatra: c.nakshatra?.value || c.nakshatra?.name || "—",
          weekday: c.weekday?.value || "—",
          lunar_month: c.lunar_month?.value || "—",
          reasons: (w.reasons || w.source_periods || []).join(", ") || "—",
          warnings: warningsArr.length ? warningsArr.join("; ") : "—",
        };
      });
    }

    // ---------- Gochar timeline ----------
    const gocharError = gocharRaw?.__error || null;
    let gocharWindows: any[] = [];

    if (!gocharRaw?.__error) {
      const rawList =
        gocharRaw?.windows ||
        gocharRaw?.timeline ||
        gocharRaw?.periods ||
        gocharRaw?.events ||
        gocharRaw?.items ||
        [];

      gocharWindows = (Array.isArray(rawList) ? rawList : [])
        .map((g: any) => {
          const evidence = g.evidence || g.window || g.timing || {};
          const start =
            pickTime(g, [
              "start",
              "start_time",
              "starts_at",
              "start_iso",
              "from",
              "begin",
            ]) ||
            pickTime(evidence, [
              "start",
              "start_time",
              "starts_at",
              "start_iso",
              "from",
            ]);
          const end =
            pickTime(g, [
              "end",
              "end_time",
              "ends_at",
              "end_iso",
              "to",
              "finish",
            ]) ||
            pickTime(evidence, [
              "end",
              "end_time",
              "ends_at",
              "end_iso",
              "to",
            ]);

          const kind = g.kind || g.type || g.event_type || "";
          const planet =
            g.planet ||
            g.body ||
            g.graha ||
            evidence.planet ||
            evidence.body ||
            null;

          const title =
            g.title ||
            g.name ||
            g.label ||
            (planet
              ? `${String(planet).replace(/\b\w/g, (c: string) =>
                  c.toUpperCase()
                )} — ${humanizeGocharKind(kind)}`
              : humanizeGocharKind(kind));

          return {
            title,
            kind: humanizeGocharKind(kind),
            planet: planet
              ? String(planet).replace(/\b\w/g, (c: string) => c.toUpperCase())
              : null,
            start,
            end,
            summary: g.summary || g.description || g.note || null,
          };
        })
        .filter((g: any) => g.title && (g.start || g.end || g.summary));
    }

    // ---------- Gochar insights ----------
    const insightsError = gocharInsightsRaw?.__error || null;
    let insights: any[] = [];

    if (!gocharInsightsRaw?.__error) {
      const rawInsights =
        gocharInsightsRaw?.importance || gocharInsightsRaw?.facts || [];

      insights = (Array.isArray(rawInsights) ? rawInsights : []).map(
        (f: any, idx: number) => {
          const evidence = f.evidence || {};
          const start =
            evidence.start ||
            evidence.starts_at ||
            evidence.from ||
            f.start ||
            null;
          const end =
            evidence.end || evidence.ends_at || evidence.to || f.end || null;

          let summary = f.summary || f.search_text || f.description || "";
          summary = summary
            .replace(
              /from\s+\d{4}-\d{2}-\d{2}T[\d:.]+Z\s+to\s+\d{4}-\d{2}-\d{2}T[\d:.]+Z/gi,
              ""
            )
            .trim();

          return {
            rank: f.rank ?? idx + 1,
            title:
              f.title ||
              humanizeGocharKind(f.kind || f.category || "Insight"),
            category: f.category || null,
            kind: f.kind || null,
            summary: summary || null,
            start,
            end,
          };
        }
      );
    }

    const payload = {
      date,
      location: DEFAULT.location,
      daily,
      choghadiya: { periods: choghadiyaPeriods },
      hora: { periods: horaPeriods },
      muhurat: {
        windows: muhuratWindows,
        purpose: muhuratRaw?.purpose || "general_work",
        error: muhuratError,
        range: { start: date, end: addDays(date, 2) },
      },
      gochar: {
        windows: gocharWindows,
        error: gocharError,
        note: "Demo natal (Bhopal). Use real birth for personal gochar.",
      },
      gochar_insights: {
        importance: insights,
        error: insightsError,
        note: "Often requires High plan on FreeAstroAPI.",
      },
    };

    await supabaseAdmin.from("panchang_cache").upsert({
      date,
      location: DEFAULT.location,
      daily: payload.daily,
      choghadiya: payload.choghadiya,
      hora: payload.hora,
      muhurat: payload.muhurat,
      gochar: payload.gochar,
      gochar_insights: payload.gochar_insights,
    });

    return NextResponse.json({
      source: "api",
      ...payload,
    });
  } catch (err: any) {
    console.error("Panchang error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load Panchang" },
      { status: 500 }
    );
  }
}