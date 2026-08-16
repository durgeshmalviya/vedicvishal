export interface BirthDetails {
  name: string;
  gender: "Male" | "Female";
  date: string;
  time: string;
  place: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

export interface PlanetData {
  current_sign: number;
  fullDegree: number;
  normDegree: number;
  isRetro: string;
  degrees: number;
  minutes: number;
  seconds: number;
  house_number: number;
  localized_name: string;
  zodiac_sign_name: string;
  zodiac_sign_lord: string;
  nakshatra_number: number;
  nakshatra_name: string;
  nakshatra_pada: number;
  nakshatra_vimsottari_lord: string;
}

export interface AscendantData {
  current_sign: number;
  fullDegree: number;
  normDegree: number;
  isRetro: string;
  degrees: number;
  minutes: number;
  seconds: number;
  house_number: number;
  localized_name: string;
  zodiac_sign_name: string;
  zodiac_sign_lord: string;
  nakshatra_number: number;
  nakshatra_name: string;
  nakshatra_pada: number;
  nakshatra_vimsottari_lord: string;
}

export interface ChartOutput {
  ascendant?: AscendantData;
  planets?: Record<string, PlanetData>;
  [key: string]: unknown;
}

export interface KundaliBasicResponse {
  statusCode: number;
  output: ChartOutput;
}

export interface DashaPeriod {
  lord: string;
  start: string;
  end: string;
  duration_days: number;
}

export interface VimshottariResponse {
  statusCode: number;
  output: {
    year_mode: string;
    balance: {
      lord: string;
      elapsed_fraction: number;
      remaining_fraction: number;
      balance_years: number;
    };
    mahadashas: DashaPeriod[];
  };
}

export interface CurrentDashaResponse {
  statusCode: number;
  output: {
    birth_datetime: string;
    target_datetime: string;
    target_basis: string;
    mahadasha?: DashaPeriod | null;
    antardasha?: DashaPeriod | null;
    pratyantardasha?: DashaPeriod | null;
  };
}

export interface KpPlanetPosition {
  longitude: number;
  sign: string;
  nakshatra: string;
  pada: number;
  star_lord: string;
  sub_lord: string;
  sub_lord_range?: {
    start_degrees_into_nakshatra: number;
    end_degrees_into_nakshatra: number;
  };
}

export interface KpChartResponse {
  statusCode: number;
  output: {
    positions: Record<string, KpPlanetPosition>;
    [key: string]: unknown;
  };
}

/** Flexible divisional / shodashvarga payload */
export interface DivisionalResponse {
  statusCode: number;
  output: Record<string, ChartOutput | unknown>;
}

export interface SavedKundli {
  id: string;
  name: string;
  gender: "Male" | "Female";
  date: string;
  time: string;
  place: string;
  latitude: number;
  longitude: number;
  timezone: number;
  createdAt: string;
  data?: ChartOutput;
  dasha?: VimshottariResponse["output"];
  currentDasha?: CurrentDashaResponse["output"];
  kp?: KpChartResponse["output"];
  vargas?: Record<string, ChartOutput>;
}

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const PLANET_ORDER = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
] as const;

export const PLANET_ABBR: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
  Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
  Ascendant: "Asc", Uranus: "Ur", Neptune: "Ne", Pluto: "Pl",
};

/** Classical Shodasha Varga (16) + extra divisions often offered */
export const VARGA_META: { key: string; label: string; d: number; focus: string }[] = [
  { key: "d1", label: "D1 Rasi", d: 1, focus: "Body & life path" },
  { key: "d2", label: "D2 Hora", d: 2, focus: "Wealth" },
  { key: "d3", label: "D3 Drekkana", d: 3, focus: "Siblings" },
  { key: "d4", label: "D4 Chaturthamsa", d: 4, focus: "Property" },
  { key: "d7", label: "D7 Saptamsa", d: 7, focus: "Children" },
  { key: "d9", label: "D9 Navamsa", d: 9, focus: "Marriage & dharma" },
  { key: "d10", label: "D10 Dasamsa", d: 10, focus: "Career" },
  { key: "d12", label: "D12 Dwadashamsa", d: 12, focus: "Parents" },
  { key: "d16", label: "D16 Shodashamsa", d: 16, focus: "Vehicles" },
  { key: "d20", label: "D20 Vimsamsa", d: 20, focus: "Spirituality" },
  { key: "d24", label: "D24 Chaturvimsamsa", d: 24, focus: "Education" },
  { key: "d27", label: "D27 Saptavimsamsa", d: 27, focus: "Strength" },
  { key: "d30", label: "D30 Trimsamsa", d: 30, focus: "Evils" },
  { key: "d40", label: "D40 Khavedamsa", d: 40, focus: "Auspiciousness" },
  { key: "d45", label: "D45 Akshavedamsa", d: 45, focus: "Character" },
  { key: "d60", label: "D60 Shashtyamsa", d: 60, focus: "Karma detail" },
];

export type ZodiacSign =
  | "aries" | "taurus" | "gemini" | "cancer"
  | "leo" | "virgo" | "libra" | "scorpio"
  | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export type Period = "daily" | "weekly" | "monthly";

export interface Horoscope {
  id: string;
  sign: ZodiacSign;
  period: Period;
  date: string;
  title: string | null;
  summary: string;
  content: string;
  created_at: string;
}

 