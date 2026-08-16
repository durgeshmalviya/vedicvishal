"use client";

import { ChartOutput, PLANET_ORDER } from "@/lib/types";
import { formatDegree, signName } from "@/lib/calculations";

export default function PlanetTable({ chart }: { chart: ChartOutput }) {
  const planets = chart.planets || {};
  const asc = chart.ascendant;

  const rows = [
    ...(asc
      ? [
          {
            name: "Ascendant",
            sign: asc.zodiac_sign_name || signName(asc.current_sign),
            degree: formatDegree(asc),
            nakshatra: asc.nakshatra_name,
            pada: asc.nakshatra_pada,
            lord: asc.nakshatra_vimsottari_lord,
            house: asc.house_number ?? 1,
            retro: false,
          },
        ]
      : []),
    ...PLANET_ORDER.filter((n) => planets[n]).map((name) => {
      const p = planets[name];
      return {
        name,
        sign: p.zodiac_sign_name || signName(p.current_sign),
        degree: formatDegree(p),
        nakshatra: p.nakshatra_name,
        pada: p.nakshatra_pada,
        lord: p.nakshatra_vimsottari_lord,
        house: p.house_number,
        retro: p.isRetro === "true" || (p.isRetro as unknown) === true,
      };
    }),
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-amber-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-amber-50 text-gray-600 text-xs uppercase tracking-wide">
            <th className="text-left px-3 py-2.5">Planet</th>
            <th className="text-left px-3 py-2.5">Sign</th>
            <th className="text-left px-3 py-2.5">Degree</th>
            <th className="text-left px-3 py-2.5">Nakshatra</th>
            <th className="text-left px-3 py-2.5">Pada</th>
            <th className="text-left px-3 py-2.5">Nak. Lord</th>
            <th className="text-left px-3 py-2.5">House</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} className={i % 2 ? "bg-white" : "bg-amber-50/40"}>
              <td className="px-3 py-2 font-medium text-gray-800">
                {r.name}
                {r.retro && <span className="ml-1 text-red-500 text-xs">(R)</span>}
              </td>
              <td className="px-3 py-2 text-gray-700">{r.sign}</td>
              <td className="px-3 py-2 text-gray-700 font-mono text-xs">{r.degree}</td>
              <td className="px-3 py-2 text-gray-700">{r.nakshatra}</td>
              <td className="px-3 py-2 text-gray-700">{r.pada}</td>
              <td className="px-3 py-2 text-gray-700">{r.lord}</td>
              <td className="px-3 py-2 text-gray-700">{r.house}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}