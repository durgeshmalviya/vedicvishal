"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { ZODIAC_SIGNS } from "@/lib/zodiac";
import { supabase } from "@/lib/supabase";
import type { Horoscope, Period } from "@/lib/types";

export default function SignDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sign = params.sign as string;
  const period = (searchParams.get("period") as Period) || "daily";

  const [horoscope, setHoroscope] = useState<Horoscope | null>(null);
  const [loading, setLoading] = useState(true);

  const signInfo = ZODIAC_SIGNS.find((z) => z.id === sign);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("horoscopes")
        .select("*")
        .eq("sign", sign)
        .eq("period", period)
        .eq("date", today)
        .single();

      if (!error) setHoroscope(data);
      setLoading(false);
    }

    if (sign) load();
  }, [sign, period]);

  if (!signInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF8E7] via-[#FFF3D6] to-[#FFE8B8] flex items-center justify-center">
        <p className="text-amber-800 text-lg">Invalid zodiac sign</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E7] via-[#FFF3D6] to-[#FFE8B8]">
      {/* Soft decorative dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-24 left-12 w-2 h-2 rounded-full bg-orange-300/40"></div>
        <div className="absolute top-48 right-16 w-3 h-3 rounded-full bg-amber-300/30"></div>
        <div className="absolute bottom-32 left-1/3 w-2 h-2 rounded-full bg-yellow-400/40"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-12 md:py-16">
        {/* Back link */}
        <Link
          href="/horoscope"
          className="inline-flex items-center gap-2 text-amber-800/80 hover:text-orange-600 font-medium mb-10 transition-colors"
        >
          <span className="text-lg">←</span>
          <span>Back to all signs</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-4xl text-white shadow-lg shadow-purple-300/40">
            {signInfo.symbol}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {signInfo.name}
            </h1>
            <p className="mt-1 text-amber-800/80 capitalize">
              {period} Horoscope • {signInfo.dates}
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-orange-100 rounded-3xl shadow-sm p-8 md:p-10">
          {loading ? (
            <div className="text-center py-16 text-amber-800/70 text-lg">
              Consulting the stars...
            </div>
          ) : horoscope ? (
            <article>
              {horoscope.title && (
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-5">
                  {horoscope.title}
                </h2>
              )}

              <p className="text-lg text-orange-700/90 italic mb-8 leading-relaxed border-l-4 border-orange-400 pl-5">
                {horoscope.summary}
              </p>

              <div
                className="prose prose-orange max-w-none text-gray-700 leading-relaxed
                  prose-headings:text-gray-900 prose-headings:font-semibold
                  prose-p:mb-4 prose-a:text-orange-600"
                dangerouslySetInnerHTML={{ __html: horoscope.content }}
              />
            </article>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                No {period} horoscope found for today.
              </p>
              <Link
                href="/horoscope"
                className="inline-block mt-6 px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium shadow-md shadow-orange-300/40 hover:shadow-lg transition"
              >
                View other signs
              </Link>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/horoscope"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-orange-200 text-amber-900 font-medium hover:bg-orange-50 hover:border-orange-300 transition"
          >
            ← All Zodiac Signs
          </Link>
        </div>
      </div>
    </div>
  );
}