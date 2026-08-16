import { NextResponse } from "next/server";

function getApiKey(): string {
  const fromEnv = (
    process.env.NAVAMSHA_API_KEY ||
    process.env.NEXT_PUBLIC_NAVAMSHA_API_KEY ||
    ""
  ).trim();
  if (fromEnv.length > 10) return fromEnv;
  return "vda_live_3811383c_FGv_ykF_MCYJ8dQ5VR7tTsJWCQfnb7M8BNZfZPheseY";
}

export async function GET() {
  const key = getApiKey();
  const source = process.env.NAVAMSHA_API_KEY ? "env" : "fallback";

  // Live probe against Navamsha
  let liveOk = false;
  let liveStatus = 0;
  let liveDetail: unknown = null;
  try {
    const res = await fetch("https://api.navamsha.in/api/v1/kundali/basic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
      },
      body: JSON.stringify({
        year: 1997,
        month: 4,
        date: 8,
        hours: 8,
        minutes: 15,
        seconds: 0,
        latitude: 22.3389,
        longitude: 77.093,
        timezone: 5.5,
      }),
    });
    liveStatus = res.status;
    liveOk = res.status === 200;
    if (!liveOk) {
      try {
        liveDetail = await res.json();
      } catch {
        liveDetail = await res.text();
      }
    }
  } catch (e) {
    liveDetail = String(e);
  }

  return NextResponse.json({
    ok: liveOk,
    apiKeyConfigured: true,
    keySource: source,
    keyPrefix: key.slice(0, 12) + "…",
    keyLength: key.length,
    navamshaProbe: {
      status: liveStatus,
      success: liveOk,
      detail: liveDetail,
    },
    hint: liveOk
      ? "Key works. Restart npm run dev if the app still shows 401, then hard-refresh the browser."
      : "Key was rejected by Navamsha. Get a new free key at https://www.navamsha.in and set NAVAMSHA_API_KEY in .env.local",
  });
}
