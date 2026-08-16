import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function roundCoord(v: number) {
  return Math.round(v * 100) / 100;
}

async function fetchPlanets(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  latitude: number,
  longitude: number,
  timezone: number
) {
  const latRounded = roundCoord(latitude);
  const lonRounded = roundCoord(longitude);

  // Cache lookup
  const { data: cached } = await supabase
    .from("navamsha_cache")
    .select("id, response, hit_count")
    .eq("mode", "planets")
    .eq("year", year)
    .eq("month", month)
    .eq("day", day)
    .eq("hour", hours)
    .eq("lat_rounded", latRounded)
    .eq("lon_rounded", lonRounded)
    .eq("timezone", timezone)
    .maybeSingle();

  if (cached) {
    supabase
      .from("navamsha_cache")
      .update({ hit_count: (cached.hit_count || 0) + 1 })
      .eq("id", cached.id)
      .then(() => {});
    return { source: "cache" as const, data: cached.response };
  }

  const apiKey = process.env.NAVAMSHA_API_KEY;
  if (!apiKey) throw new Error("NAVAMSHA_API_KEY missing");

  const payload = {
    year,
    month,
    date: day,
    day,
    hours,
    minutes,
    seconds: 0,
    latitude,
    longitude,
    lat: latitude,
    lng: longitude,
    lon: longitude,
    timezone,
    tzone: timezone,
    dob: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    tob: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
  };

  const res = await fetch("https://api.navamsha.in/api/v1/planets/extended", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(json.detail || json.message || `HTTP ${res.status}`);
  }

  await supabase.from("navamsha_cache").upsert(
    {
      mode: "planets",
      year,
      month,
      day,
      hour: hours,
      lat_rounded: latRounded,
      lon_rounded: lonRounded,
      timezone,
      original_lat: latitude,
      original_lon: longitude,
      minutes,
      response: json,
      hit_count: 1,
    },
    {
      onConflict:
        "mode,year,month,day,hour,lat_rounded,lon_rounded,timezone",
    }
  );

  return { source: "api" as const, data: json };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const now = new Date();

    // Single day (default = today)
    if (!body.startDate) {
      const year = body.year ?? now.getFullYear();
      const month = body.month ?? now.getMonth() + 1;
      const day = body.date ?? body.day ?? now.getDate();
      const hours = body.hours ?? 12;
      const minutes = body.minutes ?? 0;
      const latitude = Number(body.latitude ?? 28.6139);
      const longitude = Number(body.longitude ?? 77.209);
      const timezone = Number(body.timezone ?? 5.5);

      const result = await fetchPlanets(
        year,
        month,
        day,
        hours,
        minutes,
        latitude,
        longitude,
        timezone
      );

      return NextResponse.json({
        status: "ok",
        source: result.source,
        data: result.data,
      });
    }

    // Date range (for Moon / sign-change tracking)
    const start = new Date(body.startDate);
    const days = Math.min(Number(body.days || 15), 30);
    const latitude = Number(body.latitude ?? 28.6139);
    const longitude = Number(body.longitude ?? 77.209);
    const timezone = Number(body.timezone ?? 5.5);
    const hours = 12;
    const minutes = 0;

    const results: any[] = [];
    let apiCalls = 0;
    let cacheHits = 0;

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();

      const result = await fetchPlanets(
        year,
        month,
        day,
        hours,
        minutes,
        latitude,
        longitude,
        timezone
      );

      if (result.source === "api") apiCalls++;
      else cacheHits++;

      results.push({
        date: d.toISOString().slice(0, 10),
        source: result.source,
        data: result.data,
      });
    }

    return NextResponse.json({
      status: "ok",
      days: results.length,
      apiCalls,
      cacheHits,
      results,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}