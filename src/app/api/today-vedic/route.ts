// app/api/astrotalk-horoscope/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Revalidate the scraped HTML at most once an hour — Astrotalk's daily
// horoscope only changes once a day, so there's no reason to hit their
// server on every request.
export const revalidate = 3600;

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

// Astrotalk shows compatibility pairs as 3-letter codes, e.g. "ARI & LEO 94%"
const SIGN_CODE: Record<string, Sign> = Object.fromEntries(
  SIGNS.map((s) => [s.slice(0, 3).toUpperCase(), s])
) as Record<string, Sign>;

export async function GET(req: NextRequest) {
  // Default to "aries" when the param is missing so the endpoint never
  // returns a 400 just because the query string was omitted.
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
    const targetUrl = `https://astrotalk.com/horoscope/daily-horoscope/${signParam}`;

    const res = await fetch(targetUrl, {
      headers: {
        // A real UA reduces the chance of being served a bot-detection page.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate },
    });

    if (!res.ok) {
      throw new Error(`Astrotalk responded with ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // We deliberately parse against the flattened text rather than CSS
    // classes: Astrotalk is a Next.js site whose generated class names
    // (and possibly layout) can change on any deploy, but the surrounding
    // English copy is far more stable.
    const pageText = $("body").text().replace(/\s+/g, " ").trim();

    // "Friday, 14 August 2026"
    const dateMatch = pageText.match(
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*\d{1,2}\s+\w+\s+\d{4}/
    );

    // "Mood: 😌 Calm"
    const moodMatch = pageText.match(/Mood:\s*(\S+)\s*([A-Za-z]+)/);
    const moodEmoji = moodMatch ? moodMatch[1] : null;
    const mood = moodMatch ? moodMatch[2] : null;

    // "Lucky Number 0" (can be zero)
    const luckyMatch = pageText.match(/Lucky Number\s*(\d+)/);
    const luckyNumber = luckyMatch ? Number(luckyMatch[1]) : null;

    // Main reading sits between the "Mood: ..." line and the LOVE / CAREER / MONEY tab row.
    let horoscope: string | null = null;
    if (moodMatch) {
      const afterMood = pageText.slice(
        pageText.indexOf(moodMatch[0]) + moodMatch[0].length
      );
      const stopIdx = afterMood.search(/\bLOVE\s*CAREER\s*MONEY\b/i);
      horoscope = (
        stopIdx > -1 ? afterMood.slice(0, stopIdx) : afterMood.slice(0, 600)
      )
        .replace(/\s+/g, " ")
        .trim();
    }

    // Fallback: first substantial paragraph that opens with the sign name.
    if (!horoscope) {
      $("p").each((_, el) => {
        const t = $(el).text().trim();
        if (
          !horoscope &&
          t.length > 80 &&
          t.toLowerCase().startsWith(signParam)
        ) {
          horoscope = t;
        }
      });
    }

    if (!horoscope) {
      throw new Error(
        "Could not locate horoscope text in the Astrotalk page — markup may have changed"
      );
    }

    // "ARI & LEO 94%" -> top 3 matches by score
    const compatMatches = [
      ...pageText.matchAll(/[A-Z]{3} & ([A-Z]{3}) (\d{1,3})%/g),
    ];
    const compatibility = compatMatches
      .map((m) => ({ code: m[1], score: Number(m[2]) }))
      .filter((m) => SIGN_CODE[m.code])
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((m) => SIGN_CODE[m.code]);

    return NextResponse.json({
      ok: true,
      source: "astrotalk",
      sign: signParam,
      date: dateMatch ? dateMatch[0] : null,
      data: {
        horoscope,
        mood,
        moodEmoji,
        color: null, // Astrotalk renders the lucky colour as a swatch image, not text
        luckyNumber,
        luckyTime: null, // not published by Astrotalk
        compatibility,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to scrape Astrotalk" },
      { status: 502 }
    );
  }
}