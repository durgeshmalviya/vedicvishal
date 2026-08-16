"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SavedKundli, VARGA_META } from "@/lib/types";
import {
  fetchKpChart,
  fetchAllVargas,
  fetchVimshottariDasha,
  fetchCurrentDasha,
  fetchCurrentTransit,
  makeRelativeTransit,
  TransitRelativeResult,
} from "@/lib/api";
import {
  getSavedKundlisAsync,
  getSavedKundlis,
  saveKundli,
  initStorage,
} from "@/lib/storage";
import {
  calculateSadeSati,
  calculateMangalDosh,
  calculateYogas,
  calculateBhagyaPhal,
  kpToChartOutput,
  signName,
  calculateShadbala,
  calculateBhavabala,
  calculateAshtakvarga,
  calculateAvakhada,
} from "@/lib/calculations";
import { NumerologyProfile } from "@/lib/numerologys";
import { fetchNumerologyProfile } from "@/lib/numerology";
import { generateFullReportPDF } from "@/lib/reportDownload";
import NorthIndianChart from "@/components/NorthIndianChart";
import PlanetTable from "@/components/Planettable";
import KpTable from "@/components/Kptable";
import DashaTable from "@/components/DashaTable";
import ShadbalTable from "@/components/ShadbalTable-FIXED";
import BhavabalaCard from "@/components/BhavabalCard-FIXED";
import AshtakvarkaAnalysis from "@/components/AshtakvarkaAnalysis-FIXED";
import NumerologyAnalysis from "@/components/Numerologyanalysis ";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Globe2,
  User,
  Sparkles,
  Sun,
  Moon,
  Stars,
  Hash,
  Download,
  Loader2,
  Printer,
} from "lucide-react";

type TabKey =
  | "d1"
  | "vargas"
  | "kp"
  | "dasha"
  | "transit"
  | "numerology"
  | "sadesati"
  | "mangal"
  | "yogas"
  | "bhagya"
  | "shadbala"
  | "bhavabala"
  | "ashtakvarga"
  | "avakhada";

interface Shadbala {
  planets: {
    [key: string]: {
      sthaanaBala: number;
      diBala: number;
      kalaBala: number;
      cheshtaBala: number;
      naisargikaBala: number;
      drikBala: number;
      totalBala: number;
      baluRupas: number;
      baluRequired: number;
      baluRatio: string;
      ranking: number;
      ishitaPhalba: number;
    };
  };
}

interface Bhavabala {
  bhava: {
    [key: number]: {
      sign: string;
      balaPoints: number;
      percentStrength: number;
      remarks: string;
    };
  };
}

interface Ashtakvarga {
  bindusPerHouse: {
    [key: number]: {
      sun: number;
      moon: number;
      mars: number;
      mercury: number;
      jupiter: number;
      venus: number;
      saturn: number;
      total: number;
    };
  };
  sarvashAshtakvarga: {
    [key: number]: number;
  };
  totalSAV: number;
}

interface AvakhadaDetails {
  varna: string;
  khattriya: string;
  vasya: string;
  chatur: string;
  yoni: string;
  gan: string;
  nadi: string;
  sign: string;
  signLord: string;
  charan: number;
  tatva: string;
  nameAlphabet: string;
  paya: string;
  yunja: string;
}

export default function KundliDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const kundliId = params.id ?? "";

  const [kundli, setKundli] = useState<SavedKundli | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("d1");
  const [selectedVarga, setSelectedVarga] = useState<string>("d9");

  const [shadbala, setShadbala] = useState<Shadbala | null>(null);
  const [bhavabala, setBhavabala] = useState<Bhavabala | null>(null);
  const [ashtakvarga, setAshtakvarga] = useState<Ashtakvarga | null>(null);
  const [avakhada, setAvakhada] = useState<AvakhadaDetails | null>(null);

  const [numerology, setNumerology] = useState<NumerologyProfile | null>(null);
  const [numerologyLoading, setNumerologyLoading] = useState(false);

  const [transitData, setTransitData] = useState<TransitRelativeResult | null>(null);
  const [transitLoading, setTransitLoading] = useState(false);
  const [transitError, setTransitError] = useState<string | null>(null);

  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const loadKundliData = async () => {
      setLoading(true);
      setError("");
      setTab("d1");
      setSelectedVarga("d9");
      setShadbala(null);
      setBhavabala(null);
      setAshtakvarga(null);
      setAvakhada(null);
      setNumerology(null);
      setTransitData(null);
      setTransitError(null);
      setDownloadError(null);

      try {
        await initStorage();
        const list = (await getSavedKundlisAsync()) || getSavedKundlis();
        const found = list.find((k) => k.id === kundliId) || null;

        if (found) {
          setKundli(found);
          await enrich(found);

          const chart = found.data;
          if (chart) {
            setShadbala(calculateShadbala(chart));
            setBhavabala(calculateBhavabala(chart));
            setAshtakvarga(calculateAshtakvarga(chart));
            setAvakhada(calculateAvakhada(chart));
          }

          // Numerology derives from name + date of birth, independent of
          // the astrology chart, so it can be computed as soon as the
          // saved Kundli record is available.
          setNumerologyLoading(true);
          try {
            const profile = await fetchNumerologyProfile({
              name: found.name,
              date: found.date,
            });
            setNumerology(profile);
          } catch (numErr) {
            console.error("Numerology calculation failed", numErr);
          } finally {
            setNumerologyLoading(false);
          }
        } else {
          setKundli(null);
        }
      } catch (err) {
        console.error("Error loading kundli:", err);
        setError("Failed to load Kundli");
        setKundli(null);
      } finally {
        setLoading(false);
      }
    };

    if (kundliId) {
      loadKundliData();
    }
  }, [kundliId]);

  useEffect(() => {
    if (tab !== "transit") return;
    if (!kundli || !kundli.data) return;
    if (transitData || transitLoading) return;

    const natalChart = kundli.data;

    const loadTransit = async () => {
      setTransitLoading(true);
      setTransitError(null);
      try {
        const details = {
          name: kundli.name,
          gender: kundli.gender,
          date: kundli.date,
          time: kundli.time,
          place: kundli.place,
          latitude: kundli.latitude,
          longitude: kundli.longitude,
          timezone: kundli.timezone,
        };

        const transitChart = await fetchCurrentTransit(details);
        if (!transitChart) {
          throw new Error("Could not fetch current planetary positions");
        }

        const relative = makeRelativeTransit(natalChart, transitChart);
        if (!relative) {
          throw new Error("Could not build relative transit chart");
        }

        setTransitData(relative);
      } catch (e) {
        console.error("Transit load failed", e);
        setTransitError(e instanceof Error ? e.message : String(e));
      } finally {
        setTransitLoading(false);
      }
    };

    loadTransit();
  }, [tab, kundli, transitData, transitLoading]);

  async function enrich(k: SavedKundli) {
    const nonD1Vargas = VARGA_META.filter((v) => v.d !== 1);
    const needsVargas = nonD1Vargas.some(
      (v) =>
        !k.vargas?.[v.key]?.planets ||
        Object.keys(k.vargas[v.key]!.planets!).length === 0
    );
    const needsKp = !k.kp?.positions || Object.keys(k.kp.positions).length === 0;
    const needsDasha = !k.dasha?.mahadashas || k.dasha.mahadashas.length === 0;
    const needsCurrentDasha = !k.currentDasha;
    if (!needsVargas && !needsKp && !needsDasha && !needsCurrentDasha) return;

    setEnriching(true);
    try {
      const details = {
        name: k.name,
        gender: k.gender,
        date: k.date,
        time: k.time,
        place: k.place,
        latitude: k.latitude,
        longitude: k.longitude,
        timezone: k.timezone,
      };

      const [vargasRes, kpRes, dashaRes, currentDashaRes] =
        await Promise.allSettled([
          needsVargas ? fetchAllVargas(details) : Promise.resolve(null),
          needsKp ? fetchKpChart(details) : Promise.resolve(null),
          needsDasha ? fetchVimshottariDasha(details) : Promise.resolve(null),
          needsCurrentDasha
            ? fetchCurrentDasha(details)
            : Promise.resolve(null),
        ]);

      const updated: SavedKundli = { ...k };

      if (vargasRes.status === "fulfilled" && vargasRes.value) {
        const { vargas } = vargasRes.value;
        updated.vargas = { ...(updated.vargas || {}), ...vargas };
      }
      if (kpRes.status === "fulfilled" && kpRes.value) {
        updated.kp = kpRes.value.output;
      }
      if (dashaRes.status === "fulfilled" && dashaRes.value) {
        updated.dasha = dashaRes.value.output;
      }
      if (currentDashaRes.status === "fulfilled" && currentDashaRes.value) {
        updated.currentDasha = currentDashaRes.value.output;
      }

      saveKundli(updated);
      setKundli(updated);
    } catch (e) {
      console.error("Enrichment failed", e);
    } finally {
      setEnriching(false);
    }
  }

  async function handleDownloadReport() {
    if (!kundli || !kundli.data || !numerology) return;
    setDownloadingReport(true);
    setDownloadError(null);
    try {
      await generateFullReportPDF({
        kundli: {
          name: kundli.name,
          gender: kundli.gender,
          date: kundli.date,
          time: kundli.time,
          place: kundli.place,
        },
        chart: kundli.data,
        sadeSati: kundli.data.planets?.Moon
          ? calculateSadeSati(kundli.data.planets.Moon.current_sign)
          : null,
        mangalDosh: calculateMangalDosh(kundli.data),
        yogas: calculateYogas(kundli.data),
        bhagyaPhal: calculateBhagyaPhal(kundli.data),
        numerology,
      });
    } catch (e) {
      console.error("Report download failed", e);
      setDownloadError(
        e instanceof Error ? e.message : "Failed to generate the report."
      );
    } finally {
      setDownloadingReport(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="flex flex-col items-center gap-5">
          <div className="w-11 h-11 border-[2.5px] border-amber-200/80 border-t-amber-600 rounded-full animate-spin" />
          <p className="text-[13px] text-stone-500 tracking-[0.08em] uppercase font-medium">
            Loading Kundli
          </p>
        </div>
      </div>
    );
  }

  if (!kundli || !kundli.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#f8f7f4]">
        <p className="text-stone-500 text-lg font-medium">Kundli not found</p>
        <button
          onClick={() => router.push("/")}
          className="cursor-pointer text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors tracking-wide"
        >
          ← Back to home
        </button>
      </div>
    );
  }

  const chart = kundli.data;
  const asc = chart.ascendant;
  const moon = chart.planets?.Moon;

  const sadeSati = moon ? calculateSadeSati(moon.current_sign) : null;
  const mangalDosh = calculateMangalDosh(chart);
  const yogas = calculateYogas(chart);
  const bhagyaPhal = calculateBhagyaPhal(chart);
  const activeVargaChart =
    selectedVarga === "d1" ? chart : kundli.vargas?.[selectedVarga];
  const activeVargaMeta = VARGA_META.find((v) => v.key === selectedVarga);
  const kpChart = kpToChartOutput(kundli.kp, asc?.current_sign ?? 1);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "d1", label: "D1 Lagna" },
    { key: "vargas", label: "Vargas" },
    { key: "kp", label: "KP" },
    { key: "dasha", label: "Dasha" },
    { key: "transit", label: "Transit" },
    { key: "numerology", label: "Numerology" },
    { key: "shadbala", label: "Shadbala" },
    { key: "bhavabala", label: "Bhavabala" },
    { key: "ashtakvarga", label: "Ashtakvarga" },
    { key: "avakhada", label: "Avakhada" },
    { key: "sadesati", label: "Sade Sati" },
    { key: "mangal", label: "Mangal Dosh" },
    { key: "yogas", label: "Yogas" },
    { key: "bhagya", label: "Bhagya Phal" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-stone-800 antialiased">
      {/* ── Toolbar ── */}
      <div className="no-print sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-stone-200/50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[4.25rem] flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="cursor-pointer group flex items-center gap-2.5 text-stone-500 hover:text-stone-900 transition-colors duration-200"
          >
            <span className="text-lg leading-none group-hover:-translate-x-0.5 transition-transform duration-200">
              ←
            </span>
            <span className="hidden sm:inline text-[13px] font-medium tracking-wide">
              Back
            </span>
          </button>

          <div className="text-center select-none">
            <div className="text-[15px] font-semibold tracking-tight text-stone-900">
              AstroKundli
            </div>
            <div className="text-[10px] text-stone-400 tracking-[0.14em] uppercase mt-0.5">
              Vedic Birth Chart
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-stone-600 bg-white border border-stone-200/80 rounded-full hover:border-amber-300 hover:text-amber-800 hover:bg-amber-50/40 transition-all duration-200 shadow-sm"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadReport}
              disabled={downloadingReport || !numerology}
              title={!numerology ? "Preparing your report…" : "Download full report"}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-white bg-gradient-to-br from-[#D6A14E] via-[#C88955] to-[#8A542E] rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {downloadingReport ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span className="hidden sm:inline">
                {downloadingReport ? "Preparing…" : "Download Report"}
              </span>
            </button>
          </div>
        </div>

        {downloadError && (
          <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-2 -mt-1">
            <p className="text-[11.5px] text-red-600">{downloadError}</p>
          </div>
        )}
      </div>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-12">
        {/* ── Profile Hero ── */}
        <section className="relative overflow-hidden rounded-[36px] border border-[#E8D8C2] bg-gradient-to-br from-[#FFFEFB] via-[#FCF7EC] to-[#F8F1E2] shadow-[0_25px_70px_rgba(120,80,40,.12)] mb-10">
          {/* Celestial background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            {Array.from({ length: 45 }).map((_, i) => (
              <span
                key={i}
                className="absolute text-[#C88955] animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  fontSize: `${8 + Math.random() * 10}px`,
                  animationDelay: `${Math.random() * 5}s`,
                }}
              >
                {["✦", "☾", "☉", "✧"][i % 4]}
              </span>
            ))}
          </div>

          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-orange-100/20 blur-3xl" />

          <div className="relative p-7 sm:p-10">
            {/* Top Accent */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-10 bg-[#C88955]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#B56A3A]">
                Vedic Birth Identity
              </span>
              <div className="h-px w-10 bg-[#C88955]" />
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
              {/* Avatar */}
              <div className="relative">
                <div className="absolute inset-0 rounded-[26px] bg-amber-300/25 blur-xl" />
                <div className="relative h-24 w-24 rounded-[26px] bg-gradient-to-br from-[#D6A14E] via-[#C88955] to-[#8A542E] p-[2px] shadow-xl">
                  <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-gradient-to-br from-[#FDF8EE] to-[#F8F0DE]">
                    <span className="text-3xl font-black text-[#8A542E]">
                      {kundli.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-black leading-tight text-[#2F241C]">
                  {kundli.name}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF3DD] border border-[#E6C79E] px-3 py-1 text-sm font-medium text-[#8A542E]">
                    <User size={15} />
                    {kundli.gender}
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="text-sm text-stone-500">Birth Chart Profile</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Date of Birth", value: kundli.date, icon: CalendarDays },
                { label: "Birth Time", value: kundli.time, icon: Clock3 },
                { label: "Birth Place", value: kundli.place, icon: MapPin },
                {
                  label: "Coordinates",
                  value: `${kundli.latitude.toFixed(1)}°, ${kundli.longitude.toFixed(1)}°`,
                  icon: Globe2,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="group rounded-2xl border border-[#E8D8C2] bg-white/60 backdrop-blur-sm p-5 hover:border-[#C88955] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#F8E4BF] to-[#F4D18C] text-[#8A542E] shadow-sm">
                    <Icon size={20} />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                    {label}
                  </p>
                  <p className="mt-2 text-[15px] font-semibold text-[#3B3028] leading-snug break-words">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Astrology + Numerology Cards */}
            {asc && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 p-5">
                  <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-sky-200/20 blur-2xl" />
                  <Sparkles className="mb-3 text-sky-600" />
                  <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-sky-600">
                    Lagna
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-sky-950">
                    {signName(asc.current_sign)}
                  </h3>
                </div>

                {moon && (
                  <>
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100 p-5">
                      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-violet-200/20 blur-2xl" />
                      <Moon className="mb-3 text-violet-600" />
                      <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-violet-600">
                        Moon Sign
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-violet-950">
                        {signName(moon.current_sign)}
                      </h3>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-5">
                      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-rose-200/20 blur-2xl" />
                      <Stars className="mb-3 text-rose-600" />
                      <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-rose-600">
                        Nakshatra
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-rose-950">
                        {moon.nakshatra_name}
                      </h3>
                    </div>
                  </>
                )}

                {chart.planets?.Sun && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-5">
                    <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-amber-200/20 blur-2xl" />
                    <Sun className="mb-3 text-amber-600" />
                    <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-amber-700">
                      Sun Sign
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-amber-950">
                      {signName(chart.planets.Sun.current_sign)}
                    </h3>
                  </div>
                )}

                {/* Numerology quick card */}
                <button
                  onClick={() => setTab("numerology")}
                  className="cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 p-5 text-left hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                >
                  <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-orange-200/20 blur-2xl" />
                  <Hash className="mb-3 text-orange-600" />
                  <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-orange-700">
                    Life Path
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-orange-950">
                    {numerologyLoading || !numerology ? "…" : numerology.lifePath}
                  </h3>
                </button>
              </div>
            )}

            {(enriching || numerologyLoading) && (
              <div className="mt-8 rounded-2xl border border-[#E6C79E] bg-gradient-to-r from-[#FFF4E0] to-[#FFF8EF] p-4 flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-[#E0C08C] border-t-[#B56A3A] animate-spin" />
                <span className="text-sm font-medium text-[#8A542E]">
                  Fetching advanced Vedic and numerology analysis…
                </span>
              </div>
            )}

            {/* Bottom Ornament */}
            <div className="mt-10 flex items-center justify-center gap-5 text-[#C88955]">
              <div className="h-px w-20 bg-[#D6B18A]" />
              <span>☾</span>
              <span className="text-xl">☉</span>
              <span>✦</span>
              <div className="h-px w-20 bg-[#D6B18A]" />
            </div>
          </div>
        </section>

        {/* ── Tabs ── */}
        <div className="no-print mb-9 -mx-5 sm:mx-0 px-5 sm:px-0 overflow-x-auto scrollbar-hide">
          <div className="inline-flex gap-1 p-1.5 bg-stone-100/70 rounded-2xl min-w-max sm:min-w-0 sm:flex-wrap border border-stone-200/40">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`cursor-pointer px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                  tab === t.key
                    ? "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200/70"
                    : "text-stone-500 hover:text-stone-800 hover:bg-white/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="space-y-7">
          {/* D1 */}
          {tab === "d1" && (
            <div className="space-y-7">
              <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9 flex justify-center overflow-x-auto">
                <NorthIndianChart chart={chart} title="Lagna Chart (D1)" />
              </div>
              <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
                <h2 className="text-[17px] font-semibold text-stone-900 mb-6 tracking-tight">
                  Planetary Positions
                </h2>
                <div className="overflow-x-auto">
                  <PlanetTable chart={chart} />
                </div>
              </div>
            </div>
          )}

          {/* Vargas */}
          {tab === "vargas" && (
            <div className="space-y-7">
              <div className="flex flex-wrap gap-2">
                {VARGA_META.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setSelectedVarga(v.key)}
                    title={v.label}
                    className={`cursor-pointer px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 ${
                      selectedVarga === v.key
                        ? "bg-stone-900 text-white shadow-md"
                        : "bg-white text-stone-600 border border-stone-200/80 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    D{v.d}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9 flex justify-center overflow-x-auto">
                {activeVargaChart ? (
                  <NorthIndianChart
                    chart={activeVargaChart}
                    title={
                      activeVargaMeta
                        ? `${activeVargaMeta.label} — ${activeVargaMeta.focus}`
                        : selectedVarga
                    }
                  />
                ) : (
                  <p className="text-sm text-stone-400 py-14 tracking-wide">
                    {enriching
                      ? `Loading ${activeVargaMeta?.label || selectedVarga}…`
                      : `${activeVargaMeta?.label || selectedVarga} not available.`}
                  </p>
                )}
              </div>

              {activeVargaChart && (
                <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
                  <h2 className="text-[17px] font-semibold text-stone-900 mb-6 tracking-tight">
                    {activeVargaMeta?.label || selectedVarga} Planetary Positions
                  </h2>
                  <div className="overflow-x-auto">
                    <PlanetTable chart={activeVargaChart} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KP */}
          {tab === "kp" && (
            <div className="space-y-7">
              <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9 flex justify-center overflow-x-auto">
                {kpChart ? (
                  <NorthIndianChart chart={kpChart} title="KP Chart" />
                ) : (
                  <p className="text-sm text-stone-400 py-14 tracking-wide">
                    {enriching ? "Loading KP chart…" : "KP chart not available."}
                  </p>
                )}
              </div>
              <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
                <h2 className="text-[17px] font-semibold text-stone-900 mb-6 tracking-tight">
                  KP — Star & Sub Lords
                </h2>
                <div className="overflow-x-auto">
                  <KpTable kp={kundli.kp} />
                </div>
              </div>
            </div>
          )}

          {/* Dasha */}
          {tab === "dasha" && (
            <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
              <h2 className="text-[17px] font-semibold text-stone-900 mb-6 tracking-tight">
                Vimshottari Dasha
              </h2>
              <div className="overflow-x-auto">
                <DashaTable
                  dasha={kundli.dasha}
                  currentDasha={kundli.currentDasha}
                />
              </div>
            </div>
          )}

          {/* ── CURRENT TRANSIT ── */}
          {tab === "transit" && (
            <div className="space-y-7">
              <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
                <div className="mb-7">
                  <h2 className="text-[17px] font-semibold text-stone-900 tracking-tight">
                    Current Transit (Gochar)
                  </h2>
                  <p className="text-[13.5px] text-stone-500 mt-1.5 leading-relaxed max-w-2xl">
                    Live planetary positions with houses counted from your natal lagna.
                    Special attention is given to the current placement of your lagna lord.
                  </p>
                </div>

                {transitLoading && (
                  <div className="flex items-center gap-3.5 py-16 justify-center">
                    <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                    <span className="text-[13.5px] text-stone-500 tracking-wide">
                      Fetching current sky positions…
                    </span>
                  </div>
                )}

                {transitError && (
                  <div className="rounded-2xl bg-red-50/90 border border-red-100 p-4 text-[13.5px] text-red-700">
                    {transitError}
                  </div>
                )}

                {transitData && !transitLoading && (
                  <div className="space-y-8">
                    {/* Lagna Lord highlight */}
                    <div className="rounded-2xl bg-gradient-to-br from-amber-50/90 to-orange-50/70 border border-amber-200/50 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <div className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-amber-700/70 mb-1.5">
                            Natal Lagna Lord
                          </div>
                          <div className="text-xl font-semibold text-amber-950 tracking-tight">
                            {transitData.lagnaLord}
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <div className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-amber-700/70 mb-1.5">
                            Currently Transiting
                          </div>
                          <div className="text-[17px] font-semibold text-amber-950 tracking-tight">
                            {transitData.lagnaLordTransitHouse != null ? (
                              <>
                                House {transitData.lagnaLordTransitHouse}
                                <span className="text-stone-500 font-normal text-[15px] ml-1.5">
                                  ({transitData.lagnaLordTransitSign})
                                </span>
                              </>
                            ) : (
                              "—"
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-[12.5px] text-amber-800/75 leading-relaxed">
                        {transitData.note}
                      </p>
                    </div>

                    <div className="flex justify-center overflow-x-auto">
                      <NorthIndianChart
                        chart={transitData.chart}
                        title="Current Transit (from natal lagna)"
                      />
                    </div>

                    <div>
                      <h3 className="text-[15px] font-semibold text-stone-900 mb-5 tracking-tight">
                        Transit Planetary Positions
                      </h3>
                      <div className="overflow-x-auto">
                        <PlanetTable chart={transitData.chart} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Numerology */}
          {tab === "numerology" && (
            <div className="space-y-7">
              {numerologyLoading && !numerology && (
                <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9 flex items-center justify-center gap-3.5 py-20">
                  <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                  <span className="text-[13.5px] text-stone-500 tracking-wide">
                    Calculating numerology from name and birth date…
                  </span>
                </div>
              )}

              {numerology && (
                <>
                  <div className="mb-1">
                    <h2 className="text-[17px] font-semibold text-stone-900 tracking-tight">
                      Numerology
                    </h2>
                    <p className="text-[13.5px] text-stone-500 mt-1.5 leading-relaxed max-w-2xl">
                      Derived from {kundli.name}&rsquo;s full name and date of birth using
                      Pythagorean numerology principles.
                    </p>
                  </div>
                  <NumerologyAnalysis numerology={numerology} kundliId={kundliId} />
                </>
              )}

              {!numerologyLoading && !numerology && (
                <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
                  <p className="text-sm text-stone-500">
                    Numerology data unavailable for this profile.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Shadbala */}
          {tab === "shadbala" && shadbala && (
            <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
              <h2 className="text-[17px] font-semibold text-stone-900 tracking-tight">
                Shadbala
              </h2>
              <p className="text-[13.5px] text-stone-500 mt-1.5 mb-7 leading-relaxed">
                Six-fold planetary strength analysis based on position, direction,
                time, motion, natural power and aspects.
              </p>
              <ShadbalTable
                key={kundliId}
                shadbala={shadbala}
                kundliId={kundliId}
              />
            </div>
          )}

          {/* Bhavabala */}
          {tab === "bhavabala" && bhavabala && (
            <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
              <h2 className="text-[17px] font-semibold text-stone-900 tracking-tight">
                Bhavabala
              </h2>
              <p className="text-[13.5px] text-stone-500 mt-1.5 mb-7 leading-relaxed">
                Relative power and influence of each of the 12 houses.
              </p>
              <BhavabalaCard key={kundliId} bhavabala={bhavabala} />
            </div>
          )}

          {/* Ashtakvarga */}
          {tab === "ashtakvarga" && ashtakvarga && (
            <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
              <h2 className="text-[17px] font-semibold text-stone-900 tracking-tight">
                Ashtakvarga
              </h2>
              <p className="text-[13.5px] text-stone-500 mt-1.5 mb-7 leading-relaxed">
                Bindu distribution measuring planetary strength across houses.
              </p>
              <AshtakvarkaAnalysis
                key={kundliId}
                ashtakvarga={ashtakvarga}
              />
            </div>
          )}

          {/* Avakhada */}
          {tab === "avakhada" && avakhada && (
            <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
              <h2 className="text-[17px] font-semibold text-stone-900 tracking-tight">
                Avakhada
              </h2>
              <p className="text-[13.5px] text-stone-500 mt-1.5 mb-7 leading-relaxed">
                Classical attributes derived from the birth chart.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: "Varna", value: avakhada.varna, desc: "Caste Classification" },
                  { label: "Khattriya", value: avakhada.khattriya, desc: "Sub-caste" },
                  { label: "Vasya", value: avakhada.vasya, desc: "Predominant Nature" },
                  { label: "Yoni", value: avakhada.yoni, desc: "Animal Nature" },
                  { label: "Gan", value: avakhada.gan, desc: "Divine Class" },
                  { label: "Nadi", value: avakhada.nadi, desc: "Temperament / Pulse" },
                  { label: "Sign", value: avakhada.sign, desc: "Zodiac Sign" },
                  { label: "Sign Lord", value: avakhada.signLord, desc: "Ruling Planet" },
                  { label: "Charan", value: avakhada.charan, desc: "Phase / Quarter" },
                  { label: "Tatva", value: avakhada.tatva, desc: "Element" },
                  { label: "Name Alphabet", value: avakhada.nameAlphabet, desc: "Syllable" },
                  { label: "Paya", value: avakhada.paya, desc: "Metal" },
                  { label: "Yunja", value: avakhada.yunja, desc: "Direction" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="group rounded-2xl bg-stone-50/80 border border-stone-100/80 p-4.5 hover:bg-white hover:border-stone-200/80 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-stone-400 mb-1.5">
                      {item.label}
                    </div>
                    <div className="text-[16px] font-semibold text-stone-900 mb-0.5 tracking-tight">
                      {item.value}
                    </div>
                    <div className="text-[12px] text-stone-500">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sade Sati */}
          {tab === "sadesati" && (
            <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
              <h2 className="text-[17px] font-semibold text-stone-900 mb-6 tracking-tight">
                Sade Sati
              </h2>

              {sadeSati ? (
                <div className="space-y-6">
                  <div
                    className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[13px] font-semibold ${
                      sadeSati.inSadeSati
                        ? "bg-red-50 text-red-700 border border-red-100/80"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-100/80"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        sadeSati.inSadeSati ? "bg-red-500" : "bg-emerald-500"
                      }`}
                    />
                    {sadeSati.inSadeSati
                      ? sadeSati.phaseLabel
                      : "Not currently in Sade Sati"}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-sky-50/80 border border-sky-100/70 p-4.5">
                      <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-sky-600/70 mb-1.5">
                        Natal Moon Sign
                      </div>
                      <div className="text-[17px] font-semibold text-sky-900 tracking-tight">
                        {signName(sadeSati.moonSign)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-orange-50/80 border border-orange-100/70 p-4.5">
                      <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-orange-600/70 mb-1.5">
                        Saturn Currently In
                      </div>
                      <div className="text-[17px] font-semibold text-orange-900 tracking-tight">
                        {signName(sadeSati.saturnTransitSign)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-violet-50/80 border border-violet-100/70 p-4.5">
                      <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-violet-600/70 mb-1.5">
                        Current Leg
                      </div>
                      <div className="text-[15px] font-semibold text-violet-900 tracking-tight">
                        {sadeSati.currentLegStart}
                        {sadeSati.currentLegEnd
                          ? ` → ${sadeSati.currentLegEnd}`
                          : " → ongoing"}
                      </div>
                    </div>
                  </div>

                  <p className="text-[13.5px] text-stone-600 leading-relaxed p-5 rounded-2xl bg-stone-50/80 border border-stone-100/80">
                    {sadeSati.note}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-stone-500">
                  Moon data unavailable to calculate Sade Sati.
                </p>
              )}
            </div>
          )}

          {/* Mangal Dosh */}
          {tab === "mangal" && (
            <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
              <h2 className="text-[17px] font-semibold text-stone-900 mb-6 tracking-tight">
                Mangal Dosh
              </h2>

              <div
                className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[13px] font-semibold mb-7 ${
                  mangalDosh.overall
                    ? "bg-red-50 text-red-700 border border-red-100/80"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100/80"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    mangalDosh.overall ? "bg-red-500" : "bg-emerald-500"
                  }`}
                />
                {mangalDosh.overall
                  ? "Mangal Dosh Present"
                  : "No Mangal Dosh Detected"}
              </div>

              <div className="grid md:grid-cols-2 gap-3 mb-6">
                <div className="rounded-2xl bg-stone-50/80 border border-stone-100/80 p-5">
                  <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-stone-400 mb-2">
                    From Lagna
                  </div>
                  <div className="text-[15px] font-medium text-stone-800">
                    {mangalDosh.fromLagna.isManglik
                      ? `Mars in House ${mangalDosh.fromLagna.house} — Manglik`
                      : "Not Manglik from Lagna"}
                  </div>
                </div>
                <div className="rounded-2xl bg-stone-50/80 border border-stone-100/80 p-5">
                  <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-stone-400 mb-2">
                    From Moon
                  </div>
                  <div className="text-[15px] font-medium text-stone-800">
                    {mangalDosh.fromMoon.isManglik
                      ? `Mars in House ${mangalDosh.fromMoon.house} from Moon — Manglik`
                      : "Not Manglik from Moon"}
                  </div>
                </div>
              </div>

              <p className="text-[13.5px] text-stone-600 leading-relaxed p-5 rounded-2xl bg-sky-50/60 border border-sky-100/70">
                {mangalDosh.note}
              </p>
            </div>
          )}

          {/* Yogas */}
          {tab === "yogas" && (
            <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
              <h2 className="text-[17px] font-semibold text-stone-900 mb-6 tracking-tight">
                Yogas in Your Chart
              </h2>
              <div className="space-y-3">
                {yogas.map((y) => (
                  <div
                    key={y.name}
                    className={`rounded-2xl border p-5 transition-all duration-200 ${
                      y.present
                        ? "border-amber-200/70 bg-gradient-to-r from-amber-50/50 to-white"
                        : "border-stone-100/80 bg-stone-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            y.present ? "bg-amber-500" : "bg-stone-300"
                          }`}
                        />
                        <span className="font-semibold text-stone-900 tracking-tight">
                          {y.name}
                        </span>
                      </div>
                      {y.present && (
                        <span className="px-2.5 py-0.5 text-[10.5px] font-semibold tracking-wider uppercase bg-amber-500 text-white rounded-full">
                          Present
                        </span>
                      )}
                    </div>
                    <p className="text-[13.5px] text-stone-600 leading-relaxed pl-5.5">
                      {y.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bhagya Phal */}
          {tab === "bhagya" && (
            <div className="bg-white rounded-[1.75rem] border border-stone-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-7 sm:p-9">
              <h2 className="text-[17px] font-semibold text-stone-900 mb-6 tracking-tight">
                Bhagya Phal
              </h2>

              {bhagyaPhal ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-violet-50/80 border border-violet-100/70 p-4.5">
                      <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-violet-600/70 mb-1.5">
                        9th House Sign
                      </div>
                      <div className="text-[17px] font-semibold text-violet-900 tracking-tight">
                        {signName(bhagyaPhal.ninthHouseSign)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-indigo-50/80 border border-indigo-100/70 p-4.5">
                      <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-indigo-600/70 mb-1.5">
                        9th Lord
                      </div>
                      <div className="text-[17px] font-semibold text-indigo-900 tracking-tight">
                        {bhagyaPhal.ninthLord}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-rose-50/80 border border-rose-100/70 p-4.5">
                      <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-rose-600/70 mb-1.5">
                        9th Lord’s House
                      </div>
                      <div className="text-[17px] font-semibold text-rose-900 tracking-tight">
                        {bhagyaPhal.ninthLordHouse ?? "—"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-amber-50/70 border border-amber-100/70 p-6">
                    <p className="text-stone-800 leading-relaxed font-medium text-[14.5px]">
                      {bhagyaPhal.summary}
                    </p>
                    <p className="text-[12px] text-stone-500 mt-3.5 italic leading-relaxed">
                      {bhagyaPhal.note}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-stone-500">
                  Ascendant data unavailable.
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-9 p-5 rounded-2xl bg-red-50/90 border border-red-100/80 flex items-start gap-3.5">
            <span className="text-red-500 text-lg leading-none mt-0.5">⚠</span>
            <div>
              <p className="text-[13.5px] font-semibold text-red-800">Error</p>
              <p className="text-[13.5px] text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="h-14" />
      </main>
    </div>
  );
}