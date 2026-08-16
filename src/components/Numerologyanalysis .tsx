"use client";

import { useEffect, useState } from "react";
import { NumerologyProfile } from "@/lib/numerologys";
import { Hash, Sparkles, TrendingUp } from "lucide-react";

interface NumerologyAnalysisProps {
  numerology: NumerologyProfile;
  kundliId: string;
}

const NUM_COLORS: Record<number, { bg: string; text: string; ring: string; solid: string }> = {
  1: { bg: "from-red-50 to-orange-50", text: "text-red-900", ring: "ring-red-100", solid: "bg-red-500" },
  2: { bg: "from-sky-50 to-cyan-50", text: "text-sky-900", ring: "ring-sky-100", solid: "bg-sky-500" },
  3: { bg: "from-amber-50 to-yellow-50", text: "text-amber-900", ring: "ring-amber-100", solid: "bg-amber-500" },
  4: { bg: "from-emerald-50 to-green-50", text: "text-emerald-900", ring: "ring-emerald-100", solid: "bg-emerald-500" },
  5: { bg: "from-violet-50 to-purple-50", text: "text-violet-900", ring: "ring-violet-100", solid: "bg-violet-500" },
  6: { bg: "from-rose-50 to-pink-50", text: "text-rose-900", ring: "ring-rose-100", solid: "bg-rose-500" },
  7: { bg: "from-indigo-50 to-blue-50", text: "text-indigo-900", ring: "ring-indigo-100", solid: "bg-indigo-500" },
  8: { bg: "from-stone-100 to-stone-50", text: "text-stone-900", ring: "ring-stone-200", solid: "bg-stone-700" },
  9: { bg: "from-teal-50 to-cyan-50", text: "text-teal-900", ring: "ring-teal-100", solid: "bg-teal-500" },
  11: { bg: "from-fuchsia-50 to-purple-50", text: "text-fuchsia-900", ring: "ring-fuchsia-100", solid: "bg-fuchsia-600" },
  22: { bg: "from-amber-50 to-orange-50", text: "text-amber-950", ring: "ring-amber-200", solid: "bg-amber-700" },
};

function colorsFor(n: number) {
  return NUM_COLORS[n] || NUM_COLORS[1];
}

const NumberCircle: React.FC<{
  num: number;
  label: string;
  description?: string;
  delay?: number;
}> = ({ num, label, description, delay = 0 }) => {
  const colors = colorsFor(num);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transform transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <div
        className={`group relative bg-gradient-to-br ${colors.bg} rounded-[1.5rem] border border-stone-200/60 ring-1 ${colors.ring} p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full`}
      >
        <div className="text-center">
          <span
            className={`block text-5xl sm:text-6xl font-black ${colors.text} tracking-tighter group-hover:scale-110 transition-transform duration-300`}
          >
            {num}
          </span>
          <h3 className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${colors.text} mt-3 mb-2 opacity-80`}>
            {label}
          </h3>
          {description && (
            <p className="text-[12.5px] text-stone-600 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const CoreNumbers: React.FC<{ numerology: NumerologyProfile }> = ({ numerology }) => {
  return (
    <div className="space-y-9">
      <div>
        <h3 className="text-[13px] font-semibold text-stone-900 uppercase tracking-[0.12em] mb-5">
          Core Numbers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberCircle num={numerology.lifePath} label="Life Path" description="Your spiritual journey and purpose" delay={0} />
          <NumberCircle num={numerology.destiny} label="Destiny" description="Your life's mission and potential" delay={80} />
          <NumberCircle num={numerology.soulUrge} label="Soul Urge" description="Your inner desires and motivations" delay={160} />
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-stone-900 uppercase tracking-[0.12em] mb-5">
          Expression &amp; Personality
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <NumberCircle num={numerology.personality} label="Personality" description="How others perceive you" delay={240} />
          <NumberCircle num={numerology.expression} label="Expression" description="Your natural talents" delay={280} />
          <NumberCircle num={numerology.birthDay} label="Birth Day" description="Your innate abilities" delay={320} />
          <NumberCircle num={numerology.maturity} label="Maturity" description="Wisdom you'll develop" delay={360} />
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-stone-900 uppercase tracking-[0.12em] mb-5">
          Current Cycles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberCircle num={numerology.personalYear} label="Personal Year" description="This year's energy and theme" delay={400} />
          <NumberCircle num={numerology.personalMonth} label="Personal Month" description="This month's focus" delay={440} />
          <NumberCircle num={numerology.personalDay} label="Personal Day" description="Today's vibration" delay={480} />
        </div>
      </div>
    </div>
  );
};

const DetailedReadings: React.FC<{ numerology: NumerologyProfile }> = ({ numerology }) => {
  const [expanded, setExpanded] = useState<string | null>("life_path");

  const sections = [
    { id: "life_path", title: "Life Path Number", number: numerology.lifePath, description: numerology.descriptions.lifePath },
    { id: "destiny", title: "Destiny Number", number: numerology.destiny, description: numerology.descriptions.destiny },
    { id: "soul_urge", title: "Soul Urge Number", number: numerology.soulUrge, description: numerology.descriptions.soulUrge },
    { id: "expression", title: "Expression Number", number: numerology.expression, description: numerology.descriptions.expression },
    { id: "maturity", title: "Maturity Number", number: numerology.maturity, description: numerology.descriptions.maturity },
  ];

  return (
    <div className="space-y-3">
      {sections.map((s) => {
        const colors = colorsFor(s.number);
        const isOpen = expanded === s.id;
        return (
          <div
            key={s.id}
            onClick={() => setExpanded(isOpen ? null : s.id)}
            className={`cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden ${
              isOpen
                ? `border-stone-300/80 bg-gradient-to-br ${colors.bg} shadow-md`
                : "border-stone-200/70 bg-white hover:border-stone-300 hover:shadow-sm"
            }`}
          >
            <div className="p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${colors.solid} text-white font-bold shadow-sm transition-transform duration-300 ${isOpen ? "scale-110" : ""}`}
                >
                  {s.number}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-stone-900 text-[13.5px]">{s.title}</h4>
                  {!isOpen && (
                    <p className="text-[12px] text-stone-500 truncate mt-0.5 max-w-md">
                      {s.description}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`text-stone-400 text-xs transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </div>
            {isOpen && (
              <div className="px-5 pb-5 pt-0 border-t border-stone-200/50 mt-1">
                <p className={`text-[13px] leading-relaxed ${colors.text} pt-4`}>{s.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CompatibilityChart: React.FC<{ numerology: NumerologyProfile }> = ({ numerology }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {[
        { title: "Life Path Harmonies", items: numerology.compatibility.lifePath, tint: "sky" },
        { title: "Destiny Harmonies", items: numerology.compatibility.destiny, tint: "amber" },
      ].map((col) => (
        <div key={col.title}>
          <h4 className="text-[11px] font-semibold text-stone-500 uppercase tracking-[0.12em] mb-3">
            {col.title}
          </h4>
          <div className="space-y-2">
            {col.items.map((compat, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-default transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                  col.tint === "sky"
                    ? "bg-sky-50/70 border-sky-100/70"
                    : "bg-amber-50/70 border-amber-100/70"
                }`}
              >
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-full bg-white ${
                    col.tint === "sky" ? "text-sky-600" : "text-amber-700"
                  }`}
                >
                  #{idx + 1}
                </span>
                <span className={`text-[13px] font-medium ${col.tint === "sky" ? "text-sky-900" : "text-amber-900"}`}>
                  {compat}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const YearCyclePreview: React.FC<{ numerology: NumerologyProfile }> = ({ numerology }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[13px] font-semibold text-stone-900 uppercase tracking-[0.12em] mb-5">
          Nine-Year Cycle Ahead
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {numerology.years.map((yearData, idx) => {
            const isActive = idx === activeIdx;
            const colors = colorsFor(yearData.personalYear);
            const isCurrent = yearData.year === currentYear;

            return (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`cursor-pointer relative group aspect-square rounded-xl border transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-br ${colors.bg} border-stone-300 scale-105 shadow-md`
                    : "bg-white border-stone-200/70 hover:border-stone-300 hover:-translate-y-0.5"
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className={`text-lg sm:text-xl font-black ${isActive ? colors.text : "text-stone-500"}`}>
                    {yearData.personalYear}
                  </span>
                  <span className={`text-[10px] font-medium mt-0.5 ${isActive ? "text-stone-600" : "text-stone-400"}`}>
                    {isCurrent ? "Now" : `'${yearData.year.toString().slice(-2)}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-100/60">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-amber-700/70 mb-1">
              Year {numerology.years[activeIdx].year}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900">
              Personal Year {numerology.years[activeIdx].personalYear}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-amber-700/70 mb-1">
              Theme
            </div>
            <div className="text-[13.5px] font-medium text-stone-800 max-w-xs">
              {numerology.years[activeIdx].description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NumerologyAnalysis({ numerology, kundliId }: NumerologyAnalysisProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "detailed" | "cycles">("overview");

  const subTabs: { key: typeof activeTab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Core Numbers", icon: Hash },
    { key: "detailed", label: "Detailed Readings", icon: Sparkles },
    { key: "cycles", label: "Year Cycles", icon: TrendingUp },
  ];

  return (
    <div className="space-y-7" key={kundliId}>
      <div className="flex flex-wrap gap-2">
        {subTabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-semibold transition-all duration-200 ${
                active
                  ? "bg-stone-900 text-white shadow-md"
                  : "bg-white text-stone-600 border border-stone-200/70 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          <CoreNumbers numerology={numerology} />
          <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
            <h3 className="text-[13px] font-semibold text-stone-900 uppercase tracking-[0.12em] mb-6">
              Number Harmonies
            </h3>
            <CompatibilityChart numerology={numerology} />
          </div>
        </div>
      )}

      {activeTab === "detailed" && (
        <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
          <div className="mb-6">
            <h3 className="text-[13px] font-semibold text-stone-900 uppercase tracking-[0.12em]">
              In-Depth Number Meanings
            </h3>
            <p className="text-[13px] text-stone-500 mt-1.5">
              Tap a number to read its full significance.
            </p>
          </div>
          <DetailedReadings numerology={numerology} />
        </div>
      )}

      {activeTab === "cycles" && (
        <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
          <YearCyclePreview numerology={numerology} />
        </div>
      )}
    </div>
  );
}