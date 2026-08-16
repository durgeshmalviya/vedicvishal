import { NextRequest, NextResponse } from "next/server";
import { findCityLocal } from "@/lib/locations";

type GeoResult = {
  lat: number;
  lon: number;
  display: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  source?: string;
};

/**
 * Mappls Geocoding API - Unified geocoding solution
 * https://developer.mappls.com/documentation/sdk/Web/Web%20JS/#getting-started
 * Provides consistent results with better coverage for Indian locations
 */
async function mapplsGeocode(q: string): Promise<GeoResult[]> {
  const apiKey = process.env.MAPPLS_API_KEY;
  if (!apiKey) {
    console.warn("MAPPLS_API_KEY not configured, skipping Mappls geocoding");
    return [];
  }

  try {
    // Mappls Geocoding API endpoint
    const url = new URL("https://apis.mappls.com/advancedmaps/v1/geocode");
    url.searchParams.append("query", q);
    url.searchParams.append("key", apiKey);
    url.searchParams.append("region", "IN"); // Bias towards India for better results
    url.searchParams.append("itemCount", "10");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 7200 }, // 2-hour cache
    });

    if (!res.ok) {
      console.error(`Mappls HTTP error: ${res.status}`);
      return [];
    }

    const data = await res.json();

    // Mappls response structure: { results: [...] }
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results
      .slice(0, 10)
      .map(
        (item: {
          latitude?: number;
          lng?: number;
          lat?: number;
          lon?: number;
          placeName?: string;
          placeAddress?: string;
          city?: string;
          state?: string;
          district?: string;
          country?: string;
        }) => {
          // Mappls uses various property names; normalize them
          const lat = item.latitude ?? item.lat;
          const lon = item.lng ?? item.lon;

          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return null;
          }

          const city =
            item.city ||
            item.placeName?.split(",")[0]?.trim() ||
            "";
          const state = item.state || item.district || "";
          const display =
            item.placeAddress || item.placeName || q;

          return {
            lat,
            lon,
            display,
            city: city || undefined,
            state: state || undefined,
            country: item.country || "India",
            countryCode: "IN", // Mappls is primarily India-focused
            source: "mappls",
          };
        }
      )
      .filter(Boolean) as GeoResult[];
  } catch (error) {
    console.error("Mappls Geocode error:", error);
    return [];
  }
}

/**
 * Mappls Reverse Geocoding - Convert coordinates to address
 * Useful for pin-point location lookups
 */
async function mapplsReverseGeocode(lat: number, lon: number): Promise<GeoResult | null> {
  const apiKey = process.env.MAPPLS_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const url = new URL("https://apis.mappls.com/advancedmaps/v1/revgeocode");
    url.searchParams.append("lat", String(lat));
    url.searchParams.append("lng", String(lon));
    url.searchParams.append("key", apiKey);
    url.searchParams.append("region", "IN");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 7200 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data.results?.[0];

    if (!result) return null;

    return {
      lat,
      lon,
      display: result.formattedAddress || result.address || `${lat}, ${lon}`,
      city: result.city,
      state: result.state,
      country: result.country || "India",
      countryCode: "IN",
      source: "mappls-reverse",
    };
  } catch (error) {
    console.error("Mappls Reverse Geocode error:", error);
    return null;
  }
}

/**
 * Optional Fallback: Nominatim (OSM) if Mappls fails
 * Provides global coverage as a safety net
 */
async function nominatimFallback(q: string): Promise<GeoResult[]> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?format=json` +
      `&q=${encodeURIComponent(q)}` +
      `&limit=5` +
      `&addressdetails=1` +
      `&accept-language=en`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "AstroKundli/1.0 (https://astrokundli.com)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 7200 },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map(
        (item: {
          lat?: string;
          lon?: string;
          display_name?: string;
          address?: {
            city?: string;
            town?: string;
            village?: string;
            municipality?: string;
            state?: string;
            province?: string;
            country?: string;
            country_code?: string;
          };
        }) => {
          const lat = Number(item.lat);
          const lon = Number(item.lon);

          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return null;
          }

          const address = item.address || {};
          const city = address.city || address.town || address.village || address.municipality;
          const state = address.state || address.province;

          return {
            lat,
            lon,
            display: item.display_name || q,
            city,
            state,
            country: address.country,
            countryCode: address.country_code?.toUpperCase(),
            source: "nominatim-fallback",
          };
        }
      )
      .filter(Boolean) as GeoResult[];
  } catch (error) {
    console.error("Nominatim fallback error:", error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");

  // Support reverse geocoding via query params
  if (lat && lon) {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
      console.log(`Reverse geocoding request: ${latNum}, ${lonNum}`);
      const result = await mapplsReverseGeocode(latNum, lonNum);
      if (result) {
        return NextResponse.json({
          results: [result],
          source: "mappls-reverse",
        });
      }
    }
  }

  if (!q || q.trim().length < 1) {
    return NextResponse.json(
      { error: "Missing query (q) or coordinates (lat, lon)" },
      { status: 400 }
    );
  }

  const query = q.trim();

  console.log(`Geocoding request: "${query}"`);

  /*
   * --------------------------------------------------
   * 1. LOCAL DATABASE (instant, no network)
   * --------------------------------------------------
   */

  const local = findCityLocal(query);

  if (local) {
    console.log(`Local match found: ${local.display}`);
    return NextResponse.json({
      results: [local],
      source: "local",
    });
  }

  console.log("No local match, trying Mappls API...");

  /*
   * --------------------------------------------------
   * 2. MAPPLS GEOCODING (Primary)
   * --------------------------------------------------
   */

  const mapplsResults = await mapplsGeocode(query);
  if (mapplsResults.length > 0) {
    console.log(`Mappls results: ${mapplsResults.length}`);
    return NextResponse.json({
      results: mapplsResults,
      source: "mappls",
    });
  }

  console.log("No Mappls results, trying Nominatim fallback...");

  /*
   * --------------------------------------------------
   * 3. NOMINATIM FALLBACK (OSM - Global coverage)
   * --------------------------------------------------
   */

  const nominatimResults = await nominatimFallback(query);
  if (nominatimResults.length > 0) {
    console.log(`Nominatim results: ${nominatimResults.length}`);
    return NextResponse.json({
      results: nominatimResults,
      source: "nominatim",
    });
  }

  /*
   * --------------------------------------------------
   * 4. FUZZY LOCAL FALLBACK
   * --------------------------------------------------
   */

  const words = query.split(/[\s,]+/).filter((w) => w.length >= 2);
  for (const word of words) {
    const fuzzy = findCityLocal(word);
    if (fuzzy) {
      console.log(`Fuzzy local match: ${fuzzy.display}`);
      return NextResponse.json({
        results: [fuzzy],
        source: "local-fuzzy",
      });
    }
  }

  /*
   * --------------------------------------------------
   * 5. NOTHING FOUND
   * --------------------------------------------------
   */

  console.log(`No results found for: ${query}`);
  return NextResponse.json(
    {
      error: "Location not found. Please try another search.",
      query,
      suggestions: "Try searching for a major city name or country.",
    },
    { status: 404 }
  );
}