"use client";

import { useState } from "react";
import { BirthDetails } from "@/lib/types";
import { generateKundali, geocodePlace } from "@/lib/api";
import { suggestCities, type CityEntry } from "@/lib/locations";

export default function NewKundliPage() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState<CityEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resolvedPlace, setResolvedPlace] = useState<{
    lat: number;
    lon: number;
    display: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kundliResult, setKundliResult] = useState<any>(null); // result from generateKundali
  const [submittedDetails, setSubmittedDetails] = useState<BirthDetails | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setKundliResult(null);

    if (!name.trim() || !date || !time || !place.trim()) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const geo = resolvedPlace || (await geocodePlace(place));
      if (!geo) {
        setError(
          'Could not find the birth place. Pick a city from the suggestions (e.g. Harda, Delhi, Mumbai) or type a fuller name like "Harda, Madhya Pradesh".'
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
        timezone: 5.5, // default IST
      };

      const result = await generateKundali(details);

      // Just show the result on this page (no save, no redirect)
      setSubmittedDetails(details);
      setKundliResult(result.output ?? result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate Kundli. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#FFFDF8] via-[#FCF7EC] to-[#F8EED8] relative overflow-hidden py-16 px-4">
        {/* Celestial Background */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          {Array.from({ length: 70 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-[#C88955] animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${10 + Math.random() * 10}px`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            >
              {["✦", "☾", "☉", "✧"][i % 4]}
            </span>
          ))}
        </div>

        <main className="relative max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="h-px w-10 bg-[#C88955]" />
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B56A3A]">
                Create Your Birth Chart
              </span>
              <span className="h-px w-10 bg-[#C88955]" />
            </div>

            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              <span className="bg-gradient-to-r from-[#D11445] via-[#E11D48] to-[#F43F5E] bg-clip-text text-transparent">
                New Kundli
              </span>
            </h1>

            <p className="mt-4 text-stone-600 text-lg">
              Enter your birth details to generate an accurate Vedic Kundli and
              Numerology report.
            </p>
          </div>

          {/* Card - Form */}
          <div className="relative overflow-hidden rounded-[32px] border border-[#E6D4BD] bg-white/65 backdrop-blur-xl shadow-[0_20px_60px_rgba(120,80,40,.12)]">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#C88955] via-[#E5B05D] to-[#C88955]" />

            <div className="p-6 md:p-8 space-y-6">
              <form onSubmit={handleGenerate} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.22em] text-[#9A6A45] mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full rounded-2xl border border-[#E5D3BE] bg-[#FFFCF7] px-5 py-3.5 text-stone-700 placeholder:text-stone-400 outline-none transition-all duration-300 focus:border-[#D09A56] focus:ring-4 focus:ring-[#F6D8A5]/40"
                    required
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.22em] text-[#9A6A45] mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 rounded-2xl border border-[#E5D3BE] bg-[#FFF9F0] p-1">
                    <button
                      type="button"
                      onClick={() => setGender("Male")}
                      className={`rounded-xl py-3 font-semibold transition-all ${
                        gender === "Male"
                          ? "bg-gradient-to-r from-[#C88955] to-[#E2A95C] text-white shadow-md"
                          : "text-stone-600 hover:bg-white/60"
                      }`}
                    >
                      ♂ Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("Female")}
                      className={`rounded-xl py-3 font-semibold transition-all ${
                        gender === "Female"
                          ? "bg-gradient-to-r from-[#C88955] to-[#E2A95C] text-white shadow-md"
                          : "text-stone-600 hover:bg-white/60"
                      }`}
                    >
                      ♀ Female
                    </button>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.22em] text-[#9A6A45] mb-2">
                      Birth Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-2xl border border-[#E5D3BE] bg-[#FFFCF7] px-5 py-3.5 outline-none transition focus:border-[#D09A56] focus:ring-4 focus:ring-[#F6D8A5]/40"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.22em] text-[#9A6A45] mb-2">
                      Birth Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full rounded-2xl border border-[#E5D3BE] bg-[#FFFCF7] px-5 py-3.5 outline-none transition focus:border-[#D09A56] focus:ring-4 focus:ring-[#F6D8A5]/40"
                      required
                    />
                  </div>
                </div>

                {/* Birth Place */}
                <div className="relative">
                  <label className="block text-xs font-semibold uppercase tracking-[0.22em] text-[#9A6A45] mb-2">
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
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                    placeholder="Harda, Madhya Pradesh, India"
                    autoComplete="off"
                    className="w-full rounded-2xl border border-[#E5D3BE] bg-[#FFFCF7] px-5 py-3.5 outline-none transition focus:border-[#D09A56] focus:ring-4 focus:ring-[#F6D8A5]/40"
                    required
                  />

                  {showSuggestions && placeSuggestions.length > 0 && (
                    <ul className="absolute z-30 mt-2 w-full max-h-60 overflow-auto rounded-2xl border border-[#E6D4BD] bg-white/95 backdrop-blur-xl shadow-2xl">
                      {placeSuggestions.map((c) => {
                        const label = c.state ? `${c.name}, ${c.state}` : c.name;
                        return (
                          <li key={label + c.lat}>
                            <button
                              type="button"
                              className="w-full px-5 py-3 text-left hover:bg-[#FFF7E8] transition"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setPlace(label + ", India");
                                setResolvedPlace({
                                  lat: c.lat,
                                  lon: c.lon,
                                  display: label + ", India",
                                });
                                setShowSuggestions(false);
                              }}
                            >
                              <div className="font-semibold text-stone-800">
                                {c.name}
                              </div>
                              {c.state && (
                                <div className="text-xs text-stone-500">
                                  {c.state}
                                </div>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {resolvedPlace && (
                    <div className="mt-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                      ✓ {resolvedPlace.display}
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#C88955] via-[#E3AE5C] to-[#B56A3A] py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-60"
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
                  <span className="relative flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="opacity-25"
                          />
                          <path
                            fill="currentColor"
                            className="opacity-75"
                            d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z"
                          />
                        </svg>
                        Generating Your Kundli...
                      </>
                    ) : (
                      <>
                        ✨ Generate Kundli
                        <span className="transition group-hover:translate-x-1">→</span>
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* ========== Kundli Result (shown on same page) ========== */}
          {kundliResult && submittedDetails && (
            <div className="mt-10 relative overflow-hidden rounded-[32px] border border-[#E6D4BD] bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_rgba(120,80,40,.12)]">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#C88955] via-[#E5B05D] to-[#C88955]" />

              <div className="p-6 md:p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-stone-800">
                    Kundli for {submittedDetails.name}
                  </h2>
                  <p className="mt-2 text-stone-600 text-sm">
                    {submittedDetails.date} • {submittedDetails.time} • {submittedDetails.place}
                  </p>
                </div>

                {/* Simple display of the result.
                   Replace this with your actual Kundli chart / report components
                   when you have them. */}
                <div className="rounded-2xl border border-[#E5D3BE] bg-[#FFFCF7] p-5 overflow-auto">
                  <pre className="text-sm text-stone-700 whitespace-pre-wrap font-mono">
                    {typeof kundliResult === "string"
                      ? kundliResult
                      : JSON.stringify(kundliResult, null, 2)}
                  </pre>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setKundliResult(null);
                    setSubmittedDetails(null);
                  }}
                  className="mt-6 w-full rounded-2xl border border-[#E5D3BE] bg-white py-3 font-semibold text-stone-700 hover:bg-[#FFF7E8] transition"
                >
                  Generate Another
                </button>
              </div>
            </div>
          )}

          {/* Bottom ornament */}
          <div className="flex justify-center items-center gap-5 mt-8 text-[#C88955]">
            <div className="h-px w-20 bg-[#D6B18A]" />
            <span>☾</span>
            <span className="text-2xl">☉</span>
            <span>✦</span>
            <div className="h-px w-20 bg-[#D6B18A]" />
          </div>
        </main>
      </div>
    </>
  );
}