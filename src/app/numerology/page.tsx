// components/NumerologyCalculatorForm.tsx
"use client";

import { useState } from "react";
import { Hash, Sparkles, TrendingUp, Star, BookOpen, Globe2 } from "lucide-react";
import NumerologyAnalysis from "@/components/Numerologyanalysis ";  
 

/* ---------------- Types ---------------- */
export interface NumerologyProfile {
  lifePath: number;
  destiny: number;
  soulUrge: number;
  personality: number;
  expression: number;
  birthDay: number;
  maturity: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  descriptions: {
    lifePath: string;
    destiny: string;
    soulUrge: string;
    expression: string;
    maturity: string;
  };
  compatibility: {
    lifePath: string[];
    destiny: string[];
  };
  years: { year: number; personalYear: number; description: string }[];
}

/* ---------------- Helpers ---------------- */
const LETTER_VALUES: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

function reduce(n: number, keepMasters = true): number {
  if (keepMasters && (n === 11 || n === 22 || n === 33)) return n;
  while (n > 9) {
    n = String(n).split("").reduce((a, b) => a + Number(b), 0);
    if (keepMasters && (n === 11 || n === 22 || n === 33)) return n;
  }
  return n;
}

function nameToNumber(name: string, vowelsOnly = false, consonantsOnly = false): number {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  let sum = 0;
  for (const ch of clean) {
    const isVowel = "AEIOUY".includes(ch);
    if (vowelsOnly && !isVowel) continue;
    if (consonantsOnly && isVowel) continue;
    sum += LETTER_VALUES[ch] || 0;
  }
  return reduce(sum);
}

function lifePathFromDate(y: number, m: number, d: number): number {
  const month = reduce(m);
  const day = reduce(d);
  const year = reduce(
    String(y).split("").reduce((a, b) => a + Number(b), 0)
  );
  return reduce(month + day + year);
}

function personalYear(y: number, m: number, d: number, targetYear: number): number {
  return reduce(reduce(m) + reduce(d) + reduce(
    String(targetYear).split("").reduce((a, b) => a + Number(b), 0)
  ));
}

/* ---------------- Descriptions (short versions – expand as needed) ---------------- */
const LIFE_PATH_DESC: Record<number, string> = {
  1: "Leadership, independence, pioneering spirit. You are here to initiate and lead.",
  2: "Cooperation, sensitivity, diplomacy. Partnership and harmony are your path.",
  3: "Creativity, expression, joy. Communication and artistic gifts shine.",
  4: "Stability, hard work, building foundations. Practical mastery.",
  5: "Freedom, change, adventure. Experience through variety and movement.",
  6: "Responsibility, nurturing, service. Family and community care.",
  7: "Analysis, spirituality, inner wisdom. Seeker of truth.",
  8: "Power, material success, authority. Mastery of the material world.",
  9: "Compassion, completion, humanitarianism. Universal love and service.",
  11: "Intuitive illumination, inspiration, spiritual messenger (Master).",
  22: "Master builder – turn dreams into large-scale reality (Master).",
  33: "Master teacher of unconditional love and healing (Master).",
};

const DESTINY_DESC = { ...LIFE_PATH_DESC }; // can be specialized further
const SOUL_URGE_DESC = { ...LIFE_PATH_DESC };
const EXPRESSION_DESC = { ...LIFE_PATH_DESC };
const MATURITY_DESC = { ...LIFE_PATH_DESC };

/* ---------------- Main Form Component ---------------- */
export default function NumerologyCalculatorForm() {
  const [form, setForm] = useState({
    fullName: "",
    dob: "",          // YYYY-MM-DD
    tob: "",          // HH:MM (optional)
    place: "",        // optional
  });
  const [profile, setProfile] = useState<NumerologyProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "detailed" | "cycles" | "lalkitab" | "western">("overview");
  const [loading, setLoading] = useState(false);

  const handleCalculate = () => {
    if (!form.fullName.trim() || !form.dob) {
      alert("Please enter Full Name and Date of Birth");
      return;
    }
    setLoading(true);

    const [y, m, d] = form.dob.split("-").map(Number);
    const currentYear = new Date().getFullYear(); // 2026 in your context
    const currentMonth = new Date().getMonth() + 1;
    const currentDay = new Date().getDate();

    const lifePath = lifePathFromDate(y, m, d);
    const destiny = nameToNumber(form.fullName);               // Expression / Destiny
    const soulUrge = nameToNumber(form.fullName, true);
    const personality = nameToNumber(form.fullName, false, true);
    const expression = destiny;
    const birthDay = reduce(d);
    const maturity = reduce(lifePath + destiny);
    const pYear = personalYear(y, m, d, currentYear);
    const pMonth = reduce(pYear + currentMonth);
    const pDay = reduce(pMonth + currentDay);

    // 9-year cycle preview
    const years = Array.from({ length: 9 }, (_, i) => {
      const yr = currentYear + i;
      const py = personalYear(y, m, d, yr);
      return {
        year: yr,
        personalYear: py,
        description: LIFE_PATH_DESC[py] || "A year of growth and lessons.",
      };
    });

    const newProfile: NumerologyProfile = {
      lifePath,
      destiny,
      soulUrge,
      personality,
      expression,
      birthDay,
      maturity,
      personalYear: pYear,
      personalMonth: pMonth,
      personalDay: pDay,
      descriptions: {
        lifePath: LIFE_PATH_DESC[lifePath] || "",
        destiny: DESTINY_DESC[destiny] || "",
        soulUrge: SOUL_URGE_DESC[soulUrge] || "",
        expression: EXPRESSION_DESC[expression] || "",
        maturity: MATURITY_DESC[maturity] || "",
      },
      compatibility: {
        lifePath: [
          `Strong harmony with Life Path ${((lifePath % 9) || 9)}`,
          `Supportive with ${((lifePath + 3 - 1) % 9) + 1} & ${((lifePath + 6 - 1) % 9) + 1}`,
          "Avoid extreme conflict with opposite vibration numbers",
        ],
        destiny: [
          `Destiny ${destiny} works well with creative & practical numbers`,
          "Complementary energies amplify success",
        ],
      },
      years,
    };

    setProfile(newProfile);
    setLoading(false);
    setActiveTab("overview");
  };

  /* ---------- Current Guidance (Aug 2026 context) ---------- */
  const currentGuidance = profile ? (
    <div className="space-y-4 text-[13.5px] leading-relaxed text-stone-700">
      <p>
        <strong>Personal Year {profile.personalYear}</strong> (2026): {LIFE_PATH_DESC[profile.personalYear]}
      </p>
      <p>
        <strong>Personal Month {profile.personalMonth}</strong> &amp; <strong>Day {profile.personalDay}</strong>:
        Focus on the vibration of these numbers today. Align actions with the core energy of your Life Path {profile.lifePath}.
      </p>
      <p className="text-amber-800 font-medium">
        August 2026 note: Jupiter is exalted in Cancer (Vedic) — excellent for wisdom, family, and expansion.
        Use this window for long-term decisions, learning, and healing ancestral patterns.
      </p>
    </div>
  ) : null;

  /* ---------- Lal Kitab Section ---------- */
  const lalKitabSection = (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100 p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-red-900 mb-3">
          Lal Kitab Philosophy
        </h3>
        <p className="text-[13.5px] text-stone-700 leading-relaxed">
          Lal Kitab reads planets primarily by <strong>house</strong> (not sign). Planets are treated as guests in the
          “house” of life. Remedies are practical, everyday actions (feeding animals, donating specific items,
          behavioural corrections) rather than gemstones. Key concepts: ancestral debts (Rin), blind / sleeping planets,
          and 43-day continuous upayas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { planet: "Sun", indication: "Father, authority, vitality, ego", remedy: "Offer water to rising Sun; donate wheat/jaggery/copper on Sunday; respect father/elders." },
          { planet: "Moon", indication: "Mother, mind, emotions, home", remedy: "Donate milk/rice/silver; keep silver item; serve mother; avoid alcohol." },
          { planet: "Mars", indication: "Energy, brothers, courage, property", remedy: "Donate red masoor/sweets on Tuesday; feed monkeys; maintain sweet relations with brothers." },
          { planet: "Mercury", indication: "Intellect, speech, business, friends", remedy: "Donate green moong; feed green fodder to cows; flow a holed copper coin in water." },
          { planet: "Jupiter", indication: "Wisdom, teachers, children, dharma", remedy: "Apply saffron/turmeric tilak; donate chana dal & turmeric; respect teachers." },
          { planet: "Venus", indication: "Marriage, comforts, luxury, arts", remedy: "Donate white items/curd; serve cows; respect spouse; keep environment clean." },
          { planet: "Saturn", indication: "Discipline, career, longevity, karma", remedy: "Donate mustard oil on Saturday; feed crows/dogs; light mustard-oil lamp." },
          { planet: "Rahu", indication: "Sudden events, foreign, illusion", remedy: "Donate barley/coconut; flow coconut in running water; keep silver." },
          { planet: "Ketu", indication: "Detachment, spirituality, past karma", remedy: "Donate multi-coloured cloth or sesame; feed dogs; spiritual practices." },
        ].map((p) => (
          <div key={p.planet} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
            <h4 className="font-semibold text-stone-900 text-sm mb-1">{p.planet}</h4>
            <p className="text-[12px] text-stone-500 mb-2">{p.indication}</p>
            <p className="text-[12.5px] text-stone-700"><span className="font-medium">Upay:</span> {p.remedy}</p>
          </div>
        ))}
      </div>

      <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5">
        <h4 className="text-[12px] font-semibold uppercase tracking-wider text-stone-600 mb-2">
          Important Lal Kitab Notes
        </h4>
        <ul className="text-[13px] text-stone-700 space-y-1 list-disc pl-5">
          <li>Perform most upayas during daytime for 40–43 continuous days.</li>
          <li>Never start a remedy and stop midway; restart from day 1 if broken.</li>
          <li>Behavioural correction (truthfulness, respect to parents, control of anger) is often more powerful than material remedies.</li>
          <li>Full accurate placement requires birth time + place for house positions. The above are general planetary indications & classical remedies.</li>
        </ul>
      </div>
    </div>
  );

  /* ---------- Western View ---------- */
  const westernView = profile ? (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-indigo-900 mb-3">
          Western Perspective
        </h3>
        <p className="text-[13.5px] text-stone-700 leading-relaxed">
          Western astrology uses the <strong>tropical zodiac</strong>. Your Sun sign is determined solely by date of birth
          (approximate ranges). Numerology in the West largely follows the same Pythagorean system you see above.
          The Life Path is still the core “soul purpose” number; Expression shows talents; Soul Urge shows inner motivation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <h4 className="font-semibold text-sm mb-2">Sun Sign (approx.)</h4>
          <p className="text-[13px] text-stone-600">
            {/* Simple month-based approximation – improve with exact degree later */}
            Based on DOB month: look up classic Western Sun-sign traits for the period containing your birth date.
            Combine with your Life Path {profile.lifePath} for a hybrid reading.
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h4 className="font-semibold text-sm mb-2">Western Numerology Note</h4>
          <p className="text-[13px] text-stone-600">
            Master numbers 11, 22, 33 are retained. Personal Year cycles are widely used for timing.
            Your current Personal Year {profile.personalYear} sets the theme for the whole year.
          </p>
        </div>
      </div>

      <p className="text-[12.5px] text-stone-500 italic">
        For a precise Western natal chart (houses, aspects, transits) provide exact birth time & place and use a
        dedicated ephemeris / Swiss Ephemeris library or professional software.
      </p>
    </div>
  ) : null;

  /* ---------- UI ---------- */
  return (
    <div className="max-w-5xl mx-auto space-y-8 py-20    px-4">
      {/* FORM */}
      <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-sm p-7 sm:p-9">
        <h2 className="text-xl font-bold text-stone-900 mb-1">Numerology + Lal Kitab Report</h2>
        <p className="text-[13px] text-stone-500 mb-6">
          Enter your details. Numerology is calculated instantly. Lal Kitab & planetary sections give classical
          indications and remedies (full house placement needs exact time & place).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-stone-600 mb-1.5">Full Birth Name *</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="As on birth certificate"
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-stone-900/20"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-stone-600 mb-1.5">Date of Birth *</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-stone-900/20"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-stone-600 mb-1.5">Time of Birth (optional)</label>
            <input
              type="time"
              value={form.tob}
              onChange={(e) => setForm({ ...form, tob: e.target.value })}
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-stone-600 mb-1.5">Place of Birth (optional)</label>
            <input
              type="text"
              value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
              placeholder="City, Country"
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-[14px]"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="mt-6 w-full sm:w-auto px-8 py-3 rounded-full bg-stone-900 text-white text-[13.5px] font-semibold hover:bg-stone-800 transition disabled:opacity-60"
        >
          {loading ? "Calculating…" : "Generate Full Report"}
        </button>
      </div>

      {/* RESULTS */}
      {profile && (
        <div className="space-y-7">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "overview", label: "Core Numbers", icon: Hash },
              { key: "detailed", label: "Detailed Readings", icon: Sparkles },
              { key: "cycles", label: "Year Cycles", icon: TrendingUp },
              { key: "lalkitab", label: "Lal Kitab & Planets", icon: BookOpen },
              { key: "western", label: "Western View", icon: Globe2 },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-semibold transition ${
                    active
                      ? "bg-stone-900 text-white shadow-md"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>

        
          {activeTab === "lalkitab" && (
            <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-sm p-7 sm:p-9 space-y-8">
              <div>
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-stone-900 mb-2">
                  Current Guidance (based on today)
                </h3>
                {currentGuidance}
              </div>
              {lalKitabSection}
            </div>
          )}

          {activeTab === "western" && (
            <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-sm p-7 sm:p-9">
              {westernView}
            </div>
          )}
        </div>
      )}
    </div>
  );
}