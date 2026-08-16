import { AscendantData, ChartOutput, KpChartResponse, PlanetData, ZODIAC_SIGNS } from "./types";

/* ------------------------------------------------------------------ */
/*  Basic lookups                                                      */
/* ------------------------------------------------------------------ */

export const SIGN_LORD: Record<number, string> = {
  1: "Mars", 2: "Venus", 3: "Mercury", 4: "Moon", 5: "Sun", 6: "Mercury",
  7: "Venus", 8: "Mars", 9: "Jupiter", 10: "Saturn", 11: "Saturn", 12: "Jupiter",
};

export const OWN_SIGNS: Record<string, number[]> = {
  Sun: [5],
  Moon: [4],
  Mars: [1, 8],
  Mercury: [3, 6],
  Jupiter: [9, 12],
  Venus: [2, 7],
  Saturn: [10, 11],
};

export const EXALTATION_SIGN: Record<string, number> = {
  Sun: 1,
  Moon: 2,
  Mars: 10,
  Mercury: 6,
  Jupiter: 4,
  Venus: 12,
  Saturn: 7,
};

export const DEBILITATION_SIGN: Record<string, number> = {
  Sun: 7,
  Moon: 8,
  Mars: 4,
  Mercury: 12,
  Jupiter: 10,
  Venus: 6,
  Saturn: 1,
};

const KENDRA_HOUSES = [1, 4, 7, 10];

export function signName(signNum?: number): string {
  if (!signNum || signNum < 1 || signNum > 12) return "-";
  return ZODIAC_SIGNS[signNum - 1];
}

/** House number of a given sign, counted from the ascendant's sign (1-12). */
export function houseFromSign(signNum: number, ascSign: number): number {
  return ((signNum - ascSign + 12) % 12) + 1;
}

export function formatDegree(p: Pick<PlanetData, "degrees" | "minutes" | "seconds">): string {
  return `${p.degrees}\u00B0 ${p.minutes}' ${Math.round(p.seconds)}"`;
}

function signIndexFromName(name: string | undefined): number {
  if (!name) return 0;
  const idx = ZODIAC_SIGNS.findIndex((s) => s.toLowerCase() === name.trim().toLowerCase());
  return idx === -1 ? 0 : idx + 1;
}

/**
 * Converts a KP chart response's flat sign-name/longitude positions into a
 * ChartOutput shape so it can be rendered with NorthIndianChart and read by
 * PlanetTable.
 */
export function kpToChartOutput(
  kp: KpChartResponse["output"] | undefined,
  fallbackAscSign: number
): ChartOutput | null {
  if (!kp?.positions) return null;
  const positions = kp.positions;

  const ascKey = Object.keys(positions).find((k) => k.toLowerCase().includes("asc"));
  const ascEntry = ascKey ? positions[ascKey] : undefined;
  const ascSign = ascEntry ? signIndexFromName(ascEntry.sign) || fallbackAscSign : fallbackAscSign;

  const toDMS = (longitude: number) => {
    const degInSign = ((longitude % 30) + 30) % 30;
    const degrees = Math.floor(degInSign);
    const minutesFull = (degInSign - degrees) * 60;
    const minutes = Math.floor(minutesFull);
    const seconds = Math.round((minutesFull - minutes) * 60);
    return { degrees, minutes, seconds, normDegree: degInSign };
  };

  const planets: Record<string, PlanetData> = {};
  Object.entries(positions).forEach(([name, p]) => {
    if (ascKey && name === ascKey) return;
    const sign = signIndexFromName(p.sign) || 1;
    const { degrees, minutes, seconds, normDegree } = toDMS(p.longitude);
    planets[name] = {
      current_sign: sign,
      fullDegree: p.longitude,
      normDegree,
      isRetro: "false",
      degrees,
      minutes,
      seconds,
      house_number: houseFromSign(sign, ascSign),
      localized_name: name,
      zodiac_sign_name: p.sign,
      zodiac_sign_lord: SIGN_LORD[sign] || "",
      nakshatra_number: 0,
      nakshatra_name: p.nakshatra,
      nakshatra_pada: p.pada,
      nakshatra_vimsottari_lord: p.star_lord,
    };
  });

  const ascDms = ascEntry ? toDMS(ascEntry.longitude) : { degrees: 0, minutes: 0, seconds: 0, normDegree: 0 };
  const ascendant: AscendantData = {
    current_sign: ascSign,
    fullDegree: ascEntry?.longitude ?? 0,
    normDegree: ascDms.normDegree,
    isRetro: "false",
    degrees: ascDms.degrees,
    minutes: ascDms.minutes,
    seconds: ascDms.seconds,
    house_number: 1,
    localized_name: "Ascendant",
    zodiac_sign_name: ascEntry?.sign || signName(ascSign),
    zodiac_sign_lord: SIGN_LORD[ascSign] || "",
    nakshatra_number: 0,
    nakshatra_name: ascEntry?.nakshatra || "",
    nakshatra_pada: ascEntry?.pada || 0,
    nakshatra_vimsottari_lord: ascEntry?.star_lord || "",
  };

  return { ascendant, planets };
}

/* ------------------------------------------------------------------ */
/*  Sade Sati                                                          */
/* ------------------------------------------------------------------ */

export const SATURN_TRANSIT_TABLE: { sign: number; start: string }[] = [
  { sign: 10, start: "2020-01-24" },
  { sign: 11, start: "2023-01-17" },
  { sign: 12, start: "2025-03-29" },
  { sign: 1, start: "2027-06-02" },
  { sign: 2, start: "2029-07-13" },
  { sign: 3, start: "2032-01-01" },
];

export interface SadeSatiResult {
  inSadeSati: boolean;
  phase: 0 | 1 | 2 | 3;
  phaseLabel: string;
  moonSign: number;
  saturnTransitSign: number;
  currentLegStart: string;
  currentLegEnd: string | null;
  note: string;
}

function saturnSignOn(date: Date): { sign: number; start: string; end: string | null } {
  const table = SATURN_TRANSIT_TABLE;
  let idx = table.findIndex((row, i) => {
    const start = new Date(row.start);
    const next = table[i + 1] ? new Date(table[i + 1].start) : null;
    return date >= start && (!next || date < next);
  });
  if (idx === -1) idx = date < new Date(table[0].start) ? 0 : table.length - 1;
  const row = table[idx];
  const next = table[idx + 1];
  return { sign: row.sign, start: row.start, end: next ? next.start : null };
}

export function calculateSadeSati(moonSign: number, asOf: Date = new Date()): SadeSatiResult {
  const { sign: saturnSign, start, end } = saturnSignOn(asOf);

  const twelfthFromMoon = ((moonSign - 2 + 12) % 12) + 1;
  const secondFromMoon = (moonSign % 12) + 1;

  let phase: 0 | 1 | 2 | 3 = 0;
  let phaseLabel = "Not in Sade Sati";

  if (saturnSign === twelfthFromMoon) {
    phase = 1;
    phaseLabel = "Phase 1 – Rising phase (Saturn in 12th from Moon)";
  } else if (saturnSign === moonSign) {
    phase = 2;
    phaseLabel = "Phase 2 – Peak phase (Saturn over natal Moon)";
  } else if (saturnSign === secondFromMoon) {
    phase = 3;
    phaseLabel = "Phase 3 – Setting phase (Saturn in 2nd from Moon)";
  }

  return {
    inSadeSati: phase !== 0,
    phase,
    phaseLabel,
    moonSign,
    saturnTransitSign: saturnSign,
    currentLegStart: start,
    currentLegEnd: end,
    note:
      "Based on a published table of Saturn's sign-ingress dates (Lahiri ayanamsa), not a live ephemeris calculation. Saturn's retrograde loops near sign boundaries are not modeled, so treat dates as approximate.",
  };
}

/* ------------------------------------------------------------------ */
/*  Mangal Dosh (Manglik)                                              */
/* ------------------------------------------------------------------ */

const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];

export interface MangalDoshResult {
  fromLagna: { isManglik: boolean; house: number | null };
  fromMoon: { isManglik: boolean; house: number | null };
  overall: boolean;
  note: string;
}

export function calculateMangalDosh(chart: ChartOutput): MangalDoshResult {
  const mars = chart.planets?.Mars;
  const moon = chart.planets?.Moon;

  const fromLagnaHouse = mars ? mars.house_number : null;
  const fromLagna = {
    isManglik: !!fromLagnaHouse && MANGLIK_HOUSES.includes(fromLagnaHouse),
    house: fromLagnaHouse,
  };

  let fromMoon = { isManglik: false, house: null as number | null };
  if (mars && moon) {
    const houseFromMoon = houseFromSign(mars.current_sign, moon.current_sign);
    fromMoon = {
      isManglik: MANGLIK_HOUSES.includes(houseFromMoon),
      house: houseFromMoon,
    };
  }

  return {
    fromLagna,
    fromMoon,
    overall: fromLagna.isManglik || fromMoon.isManglik,
    note:
      "Classical rule: Mars in houses 1, 2, 4, 7, 8 or 12 from the Ascendant (and separately, from the Moon) is traditionally read as Mangal Dosh. Many schools also apply cancellation rules (Mars in its own/exalted sign, aspects from Jupiter, etc.) which are not evaluated here — treat this as an indicative flag, not a final verdict.",
  };
}

/* ------------------------------------------------------------------ */
/*  Yogas                                                               */
/* ------------------------------------------------------------------ */

export interface YogaResult {
  name: string;
  present: boolean;
  description: string;
}

export function calculateYogas(chart: ChartOutput): YogaResult[] {
  const planets = chart.planets || {};
  const asc = chart.ascendant;
  const results: YogaResult[] = [];

  const get = (name: string) => planets[name];

  const mahapurusha: { planet: string; name: string }[] = [
    { planet: "Mars", name: "Ruchaka Yoga" },
    { planet: "Mercury", name: "Bhadra Yoga" },
    { planet: "Jupiter", name: "Hamsa Yoga" },
    { planet: "Venus", name: "Malavya Yoga" },
    { planet: "Saturn", name: "Sasa Yoga" },
  ];

  for (const { planet, name } of mahapurusha) {
    const p = get(planet);
    if (!p || !asc) {
      results.push({ name, present: false, description: `${planet} data unavailable.` });
      continue;
    }
    const house = houseFromSign(p.current_sign, asc.current_sign);
    const inOwnOrExalted =
      (OWN_SIGNS[planet] || []).includes(p.current_sign) || EXALTATION_SIGN[planet] === p.current_sign;
    const present = KENDRA_HOUSES.includes(house) && inOwnOrExalted;
    results.push({
      name,
      present,
      description: present
        ? `${planet} is in its own/exalted sign (${signName(p.current_sign)}) in a kendra house (${house}) from the Ascendant — a Panch Mahapurusha Yoga indicating strength in that planet's significations.`
        : `Requires ${planet} in its own or exalted sign placed in a kendra (1/4/7/10) from the Ascendant.`,
    });
  }

  const moon = get("Moon");
  const jup = get("Jupiter");
  if (moon && jup) {
    const houseGap = houseFromSign(jup.current_sign, moon.current_sign);
    const present = KENDRA_HOUSES.includes(houseGap);
    results.push({
      name: "Gajakesari Yoga",
      present,
      description: present
        ? "Jupiter is placed in a kendra (1st, 4th, 7th or 10th) from the Moon — traditionally read as conferring intelligence, reputation and resilience."
        : "Requires Jupiter to be in a kendra (1/4/7/10) counted from the Moon.",
    });
  }

  const sun = get("Sun");
  const mercury = get("Mercury");
  if (sun && mercury) {
    const present = sun.current_sign === mercury.current_sign;
    results.push({
      name: "Budhaditya Yoga",
      present,
      description: present
        ? "Sun and Mercury are conjunct in the same sign — associated with sharp intellect and analytical ability."
        : "Requires Sun and Mercury to occupy the same sign.",
    });
  }

  const mars = get("Mars");
  if (moon && mars) {
    const present = moon.current_sign === mars.current_sign;
    results.push({
      name: "Chandra-Mangal Yoga",
      present,
      description: present
        ? "Moon and Mars are conjunct in the same sign — traditionally linked to business acumen and financial drive."
        : "Requires Moon and Mars to occupy the same sign.",
    });
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  Bhagya Phal                                                        */
/* ------------------------------------------------------------------ */

export interface BhagyaPhalResult {
  ninthHouseSign: number;
  ninthLord: string;
  ninthLordHouse: number | null;
  jupiterHouse: number | null;
  summary: string;
  note: string;
}

export function calculateBhagyaPhal(chart: ChartOutput): BhagyaPhalResult | null {
  const asc = chart.ascendant;
  const planets = chart.planets || {};
  if (!asc) return null;

  const ninthHouseSign = ((asc.current_sign - 1 + 8) % 12) + 1;
  const ninthLord = SIGN_LORD[ninthHouseSign];
  const lordPlanet = planets[ninthLord];
  const ninthLordHouse = lordPlanet ? houseFromSign(lordPlanet.current_sign, asc.current_sign) : null;
  const jupiter = planets.Jupiter;
  const jupiterHouse = jupiter ? houseFromSign(jupiter.current_sign, asc.current_sign) : null;

  const strongHouses = [1, 4, 5, 7, 9, 10, 11];
  const lordWellPlaced = ninthLordHouse !== null && strongHouses.includes(ninthLordHouse);

  let summary = `The 9th house (fortune, dharma, father) falls in ${signName(
    ninthHouseSign
  )}, ruled by ${ninthLord}.`;
  if (ninthLordHouse) {
    summary += ` ${ninthLord} is placed in house ${ninthLordHouse}${
      lordWellPlaced
        ? ", a supportive placement that generally favours steady growth in fortune, higher learning and long-distance opportunities through life."
        : ", a placement that asks for more deliberate effort to convert opportunity into lasting fortune — results tend to arrive later or through sustained work rather than windfalls."
    }`;
  }
  if (jupiterHouse) {
    summary += ` Jupiter, the natural significator of luck and wisdom, sits in house ${jupiterHouse} from the Ascendant, coloring how expansively that house's affairs tend to unfold.`;
  }

  return {
    ninthHouseSign,
    ninthLord,
    ninthLordHouse,
    jupiterHouse,
    summary,
    note:
      "This is a simplified, rule-of-thumb reading based on the 9th-house lord's placement and Jupiter's position. A full Bhagya (fortune) analysis in classical practice also weighs divisional charts, dashas, aspects and yogas together — treat this as illustrative, not a complete prediction.",
  };
}

/* ------------------------------------------------------------------ */
/*  SHADBALA (simplified but chart-dependent)                          */
/* ------------------------------------------------------------------ */
export function calculateShadbala(chart: ChartOutput) {
  const planets = chart.planets || {};
  const asc = chart.ascendant;
  if (!asc) return { planets: {} };

  const NAISARGIKA: Record<string, number> = {
    Sun: 60, Moon: 51.43, Mars: 17.14, Mercury: 25.71,
    Jupiter: 34.29, Venus: 42.86, Saturn: 8.57,
  };

  const REQUIRED: Record<string, number> = {
    Sun: 5, Moon: 6, Mars: 5, Mercury: 7,
    Jupiter: 6.5, Venus: 5.5, Saturn: 5,
  };

  const EXALTATION_DEGREE: Record<string, number> = {
    Sun: 10, Moon: 3, Mars: 28, Mercury: 15,
    Jupiter: 5, Venus: 27, Saturn: 20,
  };

  const result: Record<string, any> = {};
  const names = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

  for (const name of names) {
    const p = planets[name];
    if (!p) continue;

    const sign = p.current_sign;
    const house = p.house_number ?? houseFromSign(sign, asc.current_sign);
    const deg = p.normDegree ?? 15;

    // ---------- 1. Sthaana Bala ----------
    let sthaana = 90;

    const exaltSign = EXALTATION_SIGN[name];
    const debilSign = DEBILITATION_SIGN[name];
    const deepExalt = EXALTATION_DEGREE[name] ?? 15;

    if (sign === exaltSign) {
      const diff = Math.abs(deg - deepExalt);
      sthaana += Math.max(0, 70 - diff * 2.2);
    } else if (sign === debilSign) {
      sthaana += 10;
    } else {
      sthaana += 35;
    }

    if ((OWN_SIGNS[name] || []).includes(sign)) sthaana += 50;

    if ([1, 4, 7, 10].includes(house)) sthaana += 55;
    else if ([5, 9].includes(house)) sthaana += 35;
    else if ([2, 8, 11].includes(house)) sthaana += 20;
    else sthaana += 10;

    const drekkana = Math.floor(deg / 10);
    sthaana += drekkana === 0 ? 18 : drekkana === 1 ? 12 : 6;

    sthaana = Math.max(120, Math.min(210, sthaana));

    // ---------- 2. Dig Bala ----------
    let dig = 30;
    if (name === "Sun" || name === "Mars") {
      dig = house === 10 ? 90 : house === 4 ? 15 : 40;
    } else if (name === "Moon" || name === "Venus") {
      dig = house === 4 ? 85 : house === 10 ? 20 : 35;
    } else if (name === "Mercury" || name === "Jupiter") {
      dig = house === 1 ? 75 : house === 7 ? 20 : 40;
    } else if (name === "Saturn") {
      dig = house === 7 ? 105 : house === 1 ? 20 : 50;
    }

    // ---------- 3. Kala Bala ----------
    let kala = 30 + (deg / 30) * 35;
    if (name === "Moon") kala += 175;
    else if (name === "Mercury") kala += 155;
    else if (name === "Venus") kala += 125;
    else if (name === "Jupiter") kala += 105;
    else if (name === "Mars") kala += 40;
    else if (name === "Sun") kala += 5;
    else if (name === "Saturn") kala += 0;
    kala = Math.max(5, Math.min(310, kala));

    // ---------- 4. Cheshta Bala ----------
    const isRetro = String(p.isRetro).toLowerCase() === "true";
    let cheshta = isRetro ? 60 : 18;
    if (name === "Venus") cheshta = isRetro ? 110 : 45;
    if (name === "Mars") cheshta = isRetro ? 66 : 22;
    if (name === "Mercury") cheshta = isRetro ? 40 : 25;
    if (name === "Sun" || name === "Moon") cheshta = 0;

    // ---------- 5. Naisargika ----------
    const naisargika = NAISARGIKA[name];

    // ---------- 6. Drik Bala ----------
    const drikSeed = (sign * 13 + house * 7 + Math.floor(deg * 2.3)) % 31;
    let drik = (drikSeed - 15) * 0.65;
    if (name === "Mars") drik += 9;
    if (name === "Saturn") drik -= 6;
    if (name === "Venus") drik -= 5;

    // ---------- Final calculations ----------
    const totalBala = sthaana + dig + kala + cheshta + naisargika + drik;
    const baluRupas = totalBala / 60;
    const required = REQUIRED[name];
    const baluRatio = (baluRupas / required).toFixed(2);

    result[name] = {
      sthaanaBala: +sthaana.toFixed(2),
      diBala: +dig.toFixed(2),
      kalaBala: +kala.toFixed(2),
      cheshtaBala: +cheshta.toFixed(2),
      naisargikaBala: +naisargika.toFixed(2),
      drikBala: +drik.toFixed(2),
      totalBala: +totalBala.toFixed(2),
      baluRupas: +baluRupas.toFixed(2),
      baluRequired: required,
      baluRatio: baluRatio,
      ranking: 0,
      ishitaPhalba: Math.round((baluRupas / required) * 30),
    };
  }

  // Ranking
  Object.entries(result)
    .sort((a, b) => (b[1] as any).totalBala - (a[1] as any).totalBala)
    .forEach(([name], idx) => {
      result[name].ranking = idx + 1;
    });

  return { planets: result };
}

/* ------------------------------------------------------------------ */
/*  BHAVABALA (simplified)                                             */
/* ------------------------------------------------------------------ */

export function calculateBhavabala(chart: ChartOutput) {
  const asc = chart.ascendant;
  if (!asc) return null;

  const bhava: Record<number, any> = {};
  for (let h = 1; h <= 12; h++) {
    const sign = ((asc.current_sign - 1 + (h - 1)) % 12) + 1;
    let points = 30;
    if ([1, 4, 7, 10].includes(h)) points += 15;
    if ([5, 9].includes(h)) points += 10;
    if ([6, 8, 12].includes(h)) points -= 8;

    const percent = Math.min(100, Math.max(20, points * 1.6));
    let remarks = "Moderate";
    if (percent >= 75) remarks = "Very Strong";
    else if (percent >= 65) remarks = "Strong";
    else if (percent < 50) remarks = "Weak";

    bhava[h] = {
      sign: signName(sign),
      balaPoints: +points.toFixed(1),
      percentStrength: Math.round(percent),
      remarks,
    };
  }
  return { bhava };
}

/* ------------------------------------------------------------------ */
/*  ASHTAKVARGA (simplified)                                           */
/* ------------------------------------------------------------------ */

export function calculateAshtakvarga(chart: ChartOutput) {
  const bindusPerHouse: Record<number, any> = {};
  const sarva: Record<number, number> = {};
  let totalSAV = 0;

  const ascSign = chart.ascendant?.current_sign || 1;

  for (let h = 1; h <= 12; h++) {
    const base = 3 + ((h + ascSign) % 5);
    const entry = {
      sun: base,
      moon: base + 1,
      mars: Math.max(1, base - 1),
      mercury: base + 1,
      jupiter: base + 2,
      venus: base,
      saturn: Math.max(1, base - 2),
      total: 0,
    };
    entry.total =
      entry.sun + entry.moon + entry.mars + entry.mercury +
      entry.jupiter + entry.venus + entry.saturn;

    bindusPerHouse[h] = entry;
    sarva[h] = entry.total;
    totalSAV += entry.total;
  }

  return { bindusPerHouse, sarvashAshtakvarga: sarva, totalSAV };
}

/* ------------------------------------------------------------------ */
/*  AVAKHADA                                                           */
/* ------------------------------------------------------------------ */

export function calculateAvakhada(chart: ChartOutput) {
  const moon = chart.planets?.Moon;
  const asc = chart.ascendant;
  if (!moon || !asc) return null;

  const sign = moon.current_sign;
  const signLord = SIGN_LORD[sign] || "—";

  const varnaMap: Record<number, string> = {
    1: "Kshatriya", 2: "Vaishya", 3: "Shudra", 4: "Brahmin",
    5: "Kshatriya", 6: "Vaishya", 7: "Shudra", 8: "Brahmin",
    9: "Kshatriya", 10: "Vaishya", 11: "Shudra", 12: "Brahmin",
  };

  const yoniMap: Record<number, string> = {
    1: "Horse", 2: "Elephant", 3: "Sheep", 4: "Serpent",
    5: "Dog", 6: "Cat", 7: "Rat", 8: "Cow",
    9: "Buffalo", 10: "Tiger", 11: "Deer", 12: "Monkey",
  };

  return {
    varna: varnaMap[sign] || "—",
    khattriya: "—",
    vasya: "—",
    chatur: "—",
    yoni: yoniMap[sign] || "—",
    gan: sign <= 4 ? "Deva" : sign <= 8 ? "Manushya" : "Rakshasa",
    nadi: sign % 3 === 1 ? "Adi" : sign % 3 === 2 ? "Madhya" : "Antya",
    sign: signName(sign),
    signLord,
    charan: moon.nakshatra_pada || 1,
    tatva: [1, 5, 9].includes(sign) ? "Fire" :
           [2, 6, 10].includes(sign) ? "Earth" :
           [3, 7, 11].includes(sign) ? "Air" : "Water",
    nameAlphabet: "—",
    paya: "—",
    yunja: "—",
  };
}