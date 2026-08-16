import React, { useMemo } from "react";

interface BinduData {
  sun: number;
  moon: number;
  mars: number;
  mercury: number;
  jupiter: number;
  venus: number;
  saturn: number;
  total: number;
}

interface AshtakvarkaProps {
  ashtakvarga: {
    bindusPerHouse: {
      [key: number]: BinduData;
    };
    sarvashAshtakvarga: {
      [key: number]: number;
    };
    totalSAV: number;
  } | null | undefined;
  kundliId?: string;
}

export default function AshtakvarkaAnalysis({ ashtakvarga, kundliId }: AshtakvarkaProps) {
  // Safety check
  if (!ashtakvarga?.bindusPerHouse) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Loading Ashtakvarga data...</p>
      </div>
    );
  }

  const bindusPerHouse = ashtakvarga.bindusPerHouse;

  // Validate we have all 12 houses
  const hasAllHouses = Object.keys(bindusPerHouse).length === 12;

  if (!hasAllHouses) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Ashtakvarga data incomplete for this Kundli (ID: {kundliId || "unknown"})</p>
      </div>
    );
  }

  const planets = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as const;
  const planetNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const maxBindus = 56; // 7 planets × 8 points max per house

  const getBinduQuality = (bindus: number) => {
    if (bindus >= 45) return { text: "Excellent", color: "bg-green-100 text-green-700 border-green-300" };
    if (bindus >= 35) return { text: "Very Good", color: "bg-cyan-100 text-cyan-700 border-cyan-300" };
    if (bindus >= 25) return { text: "Good", color: "bg-blue-100 text-blue-700 border-blue-300" };
    if (bindus >= 15) return { text: "Fair", color: "bg-yellow-100 text-yellow-700 border-yellow-300" };
    return { text: "Weak", color: "bg-orange-100 text-orange-700 border-orange-300" };
  };

  // Memoized calculations
  const stats = useMemo(() => {
    const highest = Math.max(...Object.values(bindusPerHouse).map((h) => h.total));
    const lowest = Math.min(...Object.values(bindusPerHouse).map((h) => h.total));
    const highestHouse = Object.entries(bindusPerHouse).find(([_, data]) => data.total === highest)?.[0];
    const lowestHouse = Object.entries(bindusPerHouse).find(([_, data]) => data.total === lowest)?.[0];

    return { highest, lowest, highestHouse, lowestHouse };
  }, [bindusPerHouse]);

  return (
    <div className="space-y-6">
      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-amber-50 to-amber-100 border-b-2 border-amber-300">
              <th className="px-4 py-3 text-left text-gray-800 font-bold">House</th>
              {planetNames.map((p) => (
                <th key={p} className="px-4 py-3 text-center text-gray-800 font-bold">
                  {p}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-gray-800 font-bold bg-yellow-200">Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(bindusPerHouse)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([house, data]) => {
                const quality = getBinduQuality(data.total);
                return (
                  <tr key={house} className="border-b border-gray-200 hover:bg-amber-50/40 transition">
                    <td className="px-4 py-3 text-gray-800 font-semibold">{house}</td>
                    {planets.map((planet) => (
                      <td key={planet} className="px-4 py-3 text-center text-gray-800 font-medium">
                        {data[planet] ?? "—"}
                      </td>
                    ))}
                    <td className={`px-4 py-3 text-center font-bold ${quality.color} border-l-2 border-yellow-300`}>
                      {data.total}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* House Quality Cards */}
      <div>
        <h3 className="font-bold text-gray-800 mb-4 text-sm">House Bindu Quality</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(bindusPerHouse)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([house, data]) => {
              const quality = getBinduQuality(data.total);
              return (
                <div
                  key={house}
                  className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${quality.color}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs font-bold uppercase opacity-75 mb-1">House {house}</div>
                      <div className="text-sm font-semibold opacity-90">Total Bindus</div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{data.total}</div>
                      <div className="text-xs font-semibold mt-1">{quality.text}</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-white/80"
                      style={{ width: `${(data.total / maxBindus) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Overall SAV Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-6">
          <div className="text-xs text-gray-700 uppercase font-bold tracking-wider mb-2">Total Sarvashtakvarga</div>
          <div className="text-5xl font-bold text-purple-700 mb-2">{ashtakvarga.totalSAV}</div>
          <div className="text-sm text-gray-700">Combined bindus from all 7 planets across 12 houses</div>
          <div className="mt-3 text-xs bg-white/60 rounded p-2 text-gray-700">
            <strong>Interpretation:</strong> A higher SAV (typically above 450 is excellent) indicates stronger overall
            planetary support and favorable karmic influences across the chart.
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300 rounded-xl p-6">
          <div className="text-xs text-gray-700 uppercase font-bold tracking-wider mb-2">Average Bindus per House</div>
          <div className="text-5xl font-bold text-indigo-700 mb-2">
            {(ashtakvarga.totalSAV / 12).toFixed(1)}
          </div>
          <div className="text-sm text-gray-700">Evenly distributed planetary strength</div>

          <div className="mt-3 space-y-1 text-xs">
            <div className="bg-white/60 rounded p-2 text-gray-700">
              <strong>Strongest:</strong> House {stats.highestHouse} ({stats.highest} bindus)
            </div>
            <div className="bg-white/60 rounded p-2 text-gray-700">
              <strong>Weakest:</strong> House {stats.lowestHouse} ({stats.lowest} bindus)
            </div>
          </div>
        </div>
      </div>

      {/* Planet-wise Distribution */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-800 mb-4 text-sm">Bindus by Planet (All Houses)</h3>
        <div className="space-y-3">
          {planets.map((planet, idx) => {
            const total = Object.values(bindusPerHouse).reduce((sum, house) => sum + house[planet], 0);
            const maxPlanetBindus = 56; // 8 houses max × 7 points
            const percentage = (total / maxPlanetBindus) * 100;

            const barColors = [
              "bg-yellow-500",
              "bg-blue-500",
              "bg-red-500",
              "bg-green-500",
              "bg-purple-500",
              "bg-pink-500",
              "bg-gray-700",
            ];

            return (
              <div key={planet} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800 capitalize text-sm">{planetNames[idx]}</span>
                  <span className="text-sm font-bold text-gray-700">
                    {total} <span className="text-xs text-gray-500">/ {maxPlanetBindus}</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColors[idx]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">Understanding Ashtakvarga</h3>
        <div className="space-y-2 text-xs text-gray-700">
          <p>
            Ashtakvarga is a predictive technique that uses "bindus" (dots/points) to measure the strength of planets and
            their influence on each house.
          </p>
          <div className="space-y-2 mt-3">
            <div>
              <strong>Bindus:</strong> Points assigned based on planetary relationships (aspect, conjunction, etc.)
            </div>
            <div>
              <strong>Per House:</strong> Maximum 56 bindus (8 transiting planets × 7 points each)
            </div>
            <div>
              <strong>SAV (Sarvashtakvarga):</strong> Sum of all bindus across all houses and planets
            </div>
            <div>
              <strong>High Bindus (40+):</strong> Very favorable house — excellent results for that bhava
            </div>
            <div>
              <strong>Low Bindus (−15):</strong> Unfavorable house — challenges in that area; remedies recommended
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
