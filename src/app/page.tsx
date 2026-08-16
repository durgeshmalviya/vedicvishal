"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BirthDetails, SavedKundli } from "@/lib/types";
import { generateKundali, geocodePlace } from "@/lib/api";
import { suggestCities, type CityEntry } from "@/lib/locations";
import { getSavedKundlis, saveKundli, deleteKundli, getSavedKundlisAsync, initStorage } from "@/lib/storage";
import { generateUUID } from "@/lib/uuid";
import DailyHoroscopeSection from "@/components/DailyHoroscopeSection";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState<CityEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resolvedPlace, setResolvedPlace] = useState<{ lat: number; lon: number; display: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<SavedKundli[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      await initStorage();
      const list = await getSavedKundlisAsync();
      setSaved(list.length ? list : getSavedKundlis());
    })();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !date || !time || !place.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      const geo = resolvedPlace || (await geocodePlace(place));
      if (!geo) {
        setError(
          "Could not find the birth place. Pick a city from the suggestions (e.g. Harda, Delhi, Mumbai) or type a fuller name like \"Harda, Madhya Pradesh\"."
        );
        setLoading(false);
        return;
      }

      const details: BirthDetails = {
        name: name.trim(),
        gender,
        date,
        time,
        place: geo.display || place,
        latitude: geo.lat,
        longitude: geo.lon,
        timezone: 5.5, // default IST; can be improved
      };

      const result = await generateKundali(details);
      const id = generateUUID();
      const kundli: SavedKundli = {
        id,
        ...details,
        createdAt: new Date().toISOString(),
        data: result.output,
      };
      saveKundli(kundli);
      setSaved(getSavedKundlis());
      router.push(`/kundli/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate Kundli. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = saved.filter(
    (k) =>
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.place.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen py-10"> 
      <main className="max-w-7xl mx-auto px-4 py-10">
       
<section className="relative overflow-hidden rounded-[32px] border border-amber-100/60 bg-gradient-to-br from-[#FFFDF8] via-[#FDF6E9] to-[#F9F0DC] px-6 py-16 md:px-12 lg:px-16">

  {/* Soft ambient glows matching the theme */}
  <div className="absolute -top-32 -left-20 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
  <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-orange-100/40 blur-3xl" />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-yellow-100/20 blur-[100px]" />

  {/* Soft floating orange dots (like the screenshot) */}
  <div className="absolute inset-0 pointer-events-none">
    {Array.from({ length: 40 }).map((_, i) => (
      <span
        key={i}
        className="absolute rounded-full bg-amber-400/40"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${3 + Math.random() * 5}px`,
          height: `${3 + Math.random() * 5}px`,
          opacity: 0.3 + Math.random() * 0.5,
          animation: `float ${5 + Math.random() * 6}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 4}s`,
        }}
      />
    ))}
  </div>

  <div className="relative z-10 grid md:grid-cols-2 gap-12 lg:gap-16 items-center">

    {/* Left Content - matching the screenshot exactly */}
    <div>
      <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm mb-6">
        <span>✨</span>
        Ancient Vedic Wisdom
      </div>

      <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black leading-[1.05] tracking-tight">
        <span className="text-[#E11D48]">
          Vedic Kundli
        </span>
        <br />
        <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 bg-clip-text text-transparent">
          & Numerology
        </span>
      </h1>

      <p className="mt-6 text-lg text-stone-600 leading-relaxed max-w-lg">
        Generate your free Janam Kundli, planetary analysis, and Vedic Numerology
        report instantly from your Date of Birth.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {["Birth Chart", "Numerology", "Dosha", "Panchang"].map((item) => (
          <div
            key={item}
            className="rounded-full bg-white/90 backdrop-blur px-5 py-2.5 text-sm font-medium text-amber-800 shadow-sm border border-amber-100 hover:-translate-y-0.5 hover:shadow-md hover:border-amber-200 transition-all duration-300 cursor-default"
          >
            {item}
          </div>
        ))}
      </div>
    </div>

    {/* Right Wheel - clean, spinning, matching the screenshot style */}
    <div className="flex justify-center">
      <div className="relative h-[320px] w-[320px] md:h-[380px] md:w-[380px]">

        {/* Soft outer glow */}
        <div className="absolute inset-[-16px] rounded-full bg-gradient-to-br from-amber-200/40 to-yellow-100/30 blur-2xl" />

        {/* Main spinning system */}
        <div className="absolute inset-0 animate-[spin_60s_linear_infinite]">
          
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-[10px] border-amber-300/80" />
          
          {/* Middle ring */}
          <div className="absolute inset-[28px] rounded-full border-[6px] border-amber-300/70" />
          
          {/* Inner ring */}
          <div className="absolute inset-[56px] rounded-full border-[4px] border-amber-300/60" />
        </div>

        {/* Zodiac symbols - slow elegant spin */}
        <div className="absolute inset-0 animate-[spin_80s_linear_infinite]">
          {[
            { symbol: "♈", label: "Aries" },
            { symbol: "♉", label: "Taurus" },
            { symbol: "♊", label: "Gemini" },
            { symbol: "♋", label: "Cancer" },
            { symbol: "♌", label: "Leo" },
            { symbol: "♍", label: "Virgo" },
            { symbol: "♎", label: "Libra" },
            { symbol: "♏", label: "Scorpio" },
            { symbol: "♐", label: "Sagittarius" },
            { symbol: "♑", label: "Capricorn" },
            { symbol: "♒", label: "Aquarius" },
            { symbol: "♓", label: "Pisces" },
          ].map((z, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const r = 145;
            const x = 50 + (r / 4) * Math.cos(angle);
            const y = 50 + (r / 4) * Math.sin(angle);

            return (
              <div
                key={i}
                className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-lg shadow-lg shadow-purple-200/50 border border-white/30"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                }}
                title={z.label}
              >
                {z.symbol}
              </div>
            );
          })}
        </div>

        {/* Center sun - solid warm yellow like the screenshot */}
        <div className="absolute inset-[32%] rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-400 shadow-[0_0_50px_rgba(251,191,36,0.45)] flex items-center justify-center">
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-200/60 to-transparent" />
          <span className="relative text-3xl text-amber-800 drop-shadow-sm">☀</span>
        </div>

        {/* Very subtle counter rotating accent ring */}
        <div className="absolute inset-[18px] rounded-full border border-amber-200/40 animate-[spin_40s_linear_infinite_reverse]" />
      </div>
    </div>
  </div>

  <style jsx>{`
    @keyframes float {
      0%, 100% {
        transform: translateY(0px) scale(1);
        opacity: 0.35;
      }
      50% {
        transform: translateY(-12px) scale(1.15);
        opacity: 0.7;
      }
    }
  `}</style>
</section>
             <DailyHoroscopeSection />

        <div className="grid md:grid-cols-2 gap-8">
          {/* New Kundli Form */}
          <div className="bg-white rounded-2xl shadow-md border border-amber-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">New Kundli</h2>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name, e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setGender("Male")}
                    className={`flex-1 py-2.5 rounded-xl font-medium transition ${
                      gender === "Male"
                        ? "bg-amber-400 text-white shadow"
                        : "bg-gray-50 text-gray-600 border border-gray-200"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("Female")}
                    className={`flex-1 py-2.5 rounded-xl font-medium transition ${
                      gender === "Female"
                        ? "bg-amber-400 text-white shadow"
                        : "bg-gray-50 text-gray-600 border border-gray-200"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Birth Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Birth Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Birth Place <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={place}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPlace(v);
                    setResolvedPlace(null);
                    setPlaceSuggestions(suggestCities(v, 8));
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    setPlaceSuggestions(suggestCities(place || "a", 8));
                    setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    // delay so click on suggestion registers
                    setTimeout(() => setShowSuggestions(false), 180);
                  }}
                  placeholder="Type city, e.g. Harda, Delhi, Mumbai…"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                  autoComplete="off"
                  required
                />
                {showSuggestions && placeSuggestions.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-amber-100 bg-white shadow-lg">
                    {placeSuggestions.map((c) => {
                      const label = c.state ? `${c.name}, ${c.state}` : c.name;
                      return (
                        <li key={label + c.lat}>
                          <button
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 transition"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setPlace(label + ", India");
                              setResolvedPlace({
                                lat: c.lat,
                                lon: c.lon,
                                display: label + (c.state ? ", India" : ""),
                              });
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="font-medium text-gray-800">{c.name}</span>
                            {c.state && (
                              <span className="text-gray-400 ml-1">{c.state}</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {resolvedPlace && (
                  <p className="mt-1.5 text-xs text-green-700">
                    ✓ Location: {resolvedPlace.display} ({resolvedPlace.lat.toFixed(4)}, {resolvedPlace.lon.toFixed(4)})
                  </p>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 font-semibold text-lg shadow-md hover:shadow-lg hover:from-amber-500 hover:to-yellow-500 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>Generate Kundli →</>
                )}
              </button>
            </form>
          </div>

          {/* Saved Kundlis */}
          <div className="bg-white rounded-2xl shadow-md border border-amber-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Kundli</h2>
            <div className="relative mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search kundli by name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-amber-400 outline-none"
              />
              <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="text-sm font-medium text-gray-500 mb-3">Recently Opened</div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No saved kundlis yet. Generate one!</p>
              ) : (
                filtered.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition group cursor-pointer border border-transparent hover:border-amber-100"
                    onClick={() => router.push(`/kundli/${k.id}`)}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        k.gender === "Male" ? "bg-blue-500" : "bg-teal-500"
                      }`}
                    >
                      {k.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {k.name}, {k.gender === "Male" ? "M" : "F"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(k.date + "T" + k.time).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{k.place.split(",")[0]}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteKundli(k.id);
                        setSaved(getSavedKundlis());
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info sections */}
        <section className="mt-16 space-y-10 max-w-3xl mx-auto">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">What is Kundli?</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                The term &apos;kundli&apos; is derived from the Sanskrit word &apos;Kundali&apos;, meaning &apos;circular&apos; or &apos;coiled&apos;.
                It refers to the ancient method of reading a Kundli, in which astrologers drew circular birth charts
                by hand and divided them into different houses and planetary positions. It eventually evolved into
                our modern-day Janam Kundlis.
              </p>
              <p>
                A Kundli is the precise position of all the planets and nakshatras in your horoscope at the exact
                time of your birth. You can check the astrological positions of the Sun, Moon, Rahu, Ketu, Saturn,
                Jupiter, Mars, Mercury, and Venus across the 12 houses and 12 zodiac signs. It helps you decode your
                personality and your past, present, and future, as well as prominent life events.
              </p>
              <p>
                Exact birth details matter while generating your Kundali online — even a few seconds&apos; difference
                can shift the Lagna and other planetary placements.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">What does your Kundli Contain?</h2>
            <p className="text-gray-600 mb-6">
              Each Kundli is segregated into 12 houses, and each house caters to different areas of your life.
            </p>
            <div className="space-y-5">
              {[
                { num: "1st", name: "Lagna or Ascendant", focus: "Personality and Self", desc: "This house governs your personality, physical appearance, confidence and your life's purpose." },
                { num: "2nd", name: "Dhan Bhava", focus: "Wealth and Family", desc: "Everything related to your finances and family life is covered under this house, including your upbringing, speech, savings, and family lineage." },
                { num: "3rd", name: "Sahaj Bhava", focus: "Courage and Communication", desc: "This house relates to communication skills, siblings, marketing, media, and short-distance travel." },
                { num: "4th", name: "Sukha Bhava", focus: "Home and Comforts", desc: "This house governs domestic happiness, emotional peace, vehicle, property, and mother." },
                { num: "5th", name: "Trikona or Putra Bhava", focus: "Creativity and Children", desc: "This house overlooks education, creativity, romance, children, and speculative gains." },
              ].map((h) => (
                <div key={h.num}>
                  <h3 className="font-semibold text-gray-800">
                    {h.num} House ({h.name}): {h.focus}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="no-print    text-center text-sm text-gray-500 border-t border-amber-100">
        <p className="mt-1">© {new Date().getFullYear()}    <span className="bg-gradient-to-r from-[#A14D16] via-[#C7791F] to-[#E4A437] bg-clip-text text-transparent">
        Vedic Kundli
      </span>
      <span className="mx-2 text-stone-400">&</span>
      <span className="bg-gradient-to-r from-[#4338CA] via-[#6D28D9] to-[#8B5CF6] bg-clip-text text-transparent">
        Vedic Numerology
      </span></p>
      </footer>
    </div>
  );
}