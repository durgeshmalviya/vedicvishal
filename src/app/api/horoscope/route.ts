import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600; // cache 1 hour

const SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

type Sign = (typeof SIGNS)[number];

function isSign(value: string): value is Sign {
  return (SIGNS as readonly string[]).includes(value);
}

export async function GET(req: NextRequest) {
  const signParam = (req.nextUrl.searchParams.get("sign") || "aries")
    .toLowerCase()
    .trim();

  if (!isSign(signParam)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Invalid "sign". Use one of: ${SIGNS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  try {
    const url = `https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=${signParam}`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; DailyHoroscope/1.0)",
      },
      next: { revalidate },
    });

    if (!res.ok) {
      throw new Error(`Upstream API responded with ${res.status}`);
    }

    const json = await res.json();

    // Expected shape:
    // { data: { date, period, sign, horoscope } }
    const d = json?.data;

    if (!d?.horoscope) {
      throw new Error("No horoscope text returned from upstream");
    }

    return NextResponse.json({
      ok: true,
      source: "freehoroscopeapi",
      sign: signParam,
      date: d.date ?? null,
      data: {
        horoscope: d.horoscope,
        mood: null,
        moodEmoji: null,
        color: null,
        luckyNumber: null,
        luckyTime: null,
        compatibility: [],
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Failed to fetch horoscope",
      },
      { status: 502 }
    );
  }
}