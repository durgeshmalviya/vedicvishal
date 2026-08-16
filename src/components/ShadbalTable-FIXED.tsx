import React from "react";

interface ShadbalaPlanetData {
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
}

interface ShadbalTableProps {
  shadbala: {
    planets: {
      [key: string]: ShadbalaPlanetData;
    };
  } | null | undefined;
  kundliId?: string;
}

export default function ShadbalTable({ shadbala, kundliId }: ShadbalTableProps) {
  // Safety check - if no shadbala data, show loading state
  if (!shadbala?.planets) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Loading Shadbala data...</p>
      </div>
    );
  }

  const planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
  const planetData = shadbala.planets;

  // Validate that all planets have data
  const hasPlanetData = planets.every((p) => planetData[p] != null);

  if (!hasPlanetData) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>
          Shadbala data incomplete for this Kundli
          {kundliId ? ` (ID: ${kundliId})` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-amber-50 to-amber-100 border-b-2 border-amber-300">
            <th className="px-4 py-3 text-left text-gray-800 font-bold">Component</th>
            {planets.map((p) => (
              <th key={p} className="px-4 py-3 text-center text-gray-800 font-bold">
                {p}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {[
            { label: "Sthaana Bala", key: "sthaanaBala" },
            { label: "Di Bala", key: "diBala" },
            { label: "Kala Bala", key: "kalaBala" },
            { label: "Cheshta Bala", key: "cheshtaBala" },
            { label: "Naisargika Bala", key: "naisargikaBala" },
            { label: "Drik Bala", key: "drikBala" },
          ].map((row) => (
            <tr
              key={row.key}
              className="border-b border-gray-200 hover:bg-amber-50/50 transition"
            >
              <td className="px-4 py-3 text-gray-700 font-semibold">{row.label}</td>
              {planets.map((planet) => {
                const value = planetData[planet]?.[row.key as keyof ShadbalaPlanetData];
                return (
                  <td
                    key={planet}
                    className="px-4 py-3 text-center text-gray-800 font-medium"
                  >
                    {value != null ? (value as number).toFixed(2) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Total Row */}
          <tr className="bg-yellow-50 border-t-2 border-b-2 border-amber-400 font-bold">
            <td className="px-4 py-3 text-gray-800">Total Shad Bala</td>
            {planets.map((planet) => (
              <td key={planet} className="px-4 py-3 text-center text-gray-800">
                {planetData[planet]?.totalBala != null
                  ? planetData[planet].totalBala.toFixed(2)
                  : "—"}
              </td>
            ))}
          </tr>

          {/* Balu Rupas */}
          <tr className="bg-yellow-50 border-b border-amber-200">
            <td className="px-4 py-3 text-gray-800 font-semibold">Shad Bala Rupas</td>
            {planets.map((planet) => (
              <td key={planet} className="px-4 py-3 text-center text-gray-800">
                {planetData[planet]?.baluRupas != null
                  ? planetData[planet].baluRupas.toFixed(2)
                  : "—"}
              </td>
            ))}
          </tr>

          {/* Required */}
          <tr className="bg-yellow-50 border-b border-amber-200">
            <td className="px-4 py-3 text-gray-800 font-semibold">Rupas Required</td>
            {planets.map((planet) => (
              <td key={planet} className="px-4 py-3 text-center text-gray-800">
                {planetData[planet]?.baluRequired != null
                  ? planetData[planet].baluRequired.toFixed(0)
                  : "—"}
              </td>
            ))}
          </tr>

          {/* Ratio */}
          <tr className="bg-yellow-50 border-b border-amber-200">
            <td className="px-4 py-3 text-gray-800 font-semibold">Bala Ratio</td>
            {planets.map((planet) => {
              const ratio = planetData[planet]?.baluRatio;
              const ratioNum = ratio ? parseFloat(ratio) : 0;
              return (
                <td
                  key={planet}
                  className={`px-4 py-3 text-center font-bold ${
                    ratioNum < 1 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {ratio || "—"}
                </td>
              );
            })}
          </tr>

          {/* Ranking */}
          <tr className="bg-white border-b border-gray-200">
            <td className="px-4 py-3 text-gray-700 font-semibold">Ranking</td>
            {planets.map((planet) => (
              <td key={planet} className="px-4 py-3 text-center text-gray-800 font-medium">
                {planetData[planet]?.ranking ?? "—"}
              </td>
            ))}
          </tr>

          {/* Ishita Phal Bala */}
          <tr className="bg-white">
            <td className="px-4 py-3 text-gray-700 font-semibold">Ishita Phal Bala</td>
            {planets.map((planet) => (
              <td key={planet} className="px-4 py-3 text-center text-gray-800">
                {planetData[planet]?.ishitaPhalba ?? "—"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Interpretation */}
      <div className="p-4 bg-blue-50 border-t border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-2 text-sm">Understanding Shadbala</h3>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>
            <strong>Sthaana Bala:</strong> Positional strength based on house placement
          </li>
          <li>
            <strong>Di Bala:</strong> Directional strength (exaltation/debilitation)
          </li>
          <li>
            <strong>Kala Bala:</strong> Temporal strength based on day/night and planetary hour
          </li>
          <li>
            <strong>Cheshta Bala:</strong> Motion strength (retrograde, direct, stationary)
          </li>
          <li>
            <strong>Naisargika Bala:</strong> Natural strength inherent to each planet
          </li>
          <li>
            <strong>Drik Bala:</strong> Aspect strength from other planets
          </li>
        </ul>
      </div>
    </div>
  );
}