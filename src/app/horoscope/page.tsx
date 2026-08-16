"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ZODIAC_SIGNS } from "@/lib/zodiac";
import { supabase } from "@/lib/supabase";
import type { Horoscope, Period } from "@/lib/types";

export default function HoroscopePage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [data, setData] = useState<Record<string, Horoscope | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      const { data: rows, error } = await supabase
        .from("horoscopes")
        .select("*")
        .eq("period", period)
        .eq("date", today);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const map: Record<string, Horoscope | null> = {};
      ZODIAC_SIGNS.forEach((z) => {
        map[z.id] = rows?.find((r) => r.sign === z.id) || null;
      });

      setData(map);
      setLoading(false);
    }

    fetchAll();
  }, [period]);

  return (
    <div className="min-h-screen py-10 bg-gradient-to-b from-[#FFF8E7] via-[#FFF3D6] to-[#FFE8B8]">
      {/* Decorative soft dots (same vibe as homepage) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-orange-300/40"></div>
        <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-amber-300/30"></div>
        <div className="absolute bottom-40 left-1/4 w-2 h-2 rounded-full bg-yellow-400/40"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-orange-200 text-orange-700 text-sm font-medium mb-5 shadow-sm">
            <span>✨</span>
            <span>Ancient Vedic Wisdom</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="text-[#E11D48]">Vedic</span>{" "}
            <span className="text-[#EA580C]">Horoscope</span>
          </h1>
          <p className="mt-3 text-lg text-amber-900/70 max-w-xl mx-auto">
            Discover what the stars have planned for you today, this week & this month
          </p>
        </div>

        {/* Period Tabs */}
        <div className="flex justify-center gap-3 mb-12">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
                period === p
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-300/50"
                  : "bg-white/80 text-amber-900 border border-orange-200 hover:bg-orange-50 hover:border-orange-300"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-24 text-amber-800/70 text-lg">
            Consulting the stars...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ZODIAC_SIGNS.map((sign) => {
              const h = data[sign.id];
              return (
                <Link
                  key={sign.id}
                  href={`/horoscope/${sign.id}?period=${period}`}
                  className="group block rounded-2xl bg-white/80 border border-orange-100 p-6 shadow-sm hover:shadow-lg hover:border-orange-300 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {/* Purple circle like the homepage zodiac icons */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl text-white shadow-md shadow-purple-300/40 group-hover:scale-105 transition-transform">
                      {sign.symbol}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {sign.name}
                      </h2>
                      <p className="text-sm text-amber-700/70">{sign.dates}</p>
                    </div>
                  </div>

                  {h ? (
                    <>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                        {h.summary}
                      </p>
                      <span className="inline-flex items-center text-orange-600 text-sm font-medium group-hover:gap-2 transition-all">
                        Read full horoscope
                        <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No {period} horoscope available yet
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}