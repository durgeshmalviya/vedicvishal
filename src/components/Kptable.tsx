"use client";

import { KpChartResponse } from "@/lib/types";

export default function KpTable({ kp }: { kp: KpChartResponse["output"] | undefined }) {
  if (!kp || !kp.positions) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        KP data not available for this Kundli yet.
      </p>
    );
  }

  const rows = Object.entries(kp.positions);

  return (
    <div className="overflow-x-auto rounded-xl border border-amber-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-amber-50 text-gray-600 text-xs uppercase tracking-wide">
            <th className="text-left px-3 py-2.5">Planet</th>
            <th className="text-left px-3 py-2.5">Longitude</th>
            <th className="text-left px-3 py-2.5">Sign</th>
            <th className="text-left px-3 py-2.5">Nakshatra</th>
            <th className="text-left px-3 py-2.5">Pada</th>
            <th className="text-left px-3 py-2.5">Star Lord</th>
            <th className="text-left px-3 py-2.5">Sub Lord</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, p], i) => (
            <tr key={name} className={i % 2 ? "bg-white" : "bg-amber-50/40"}>
              <td className="px-3 py-2 font-medium text-gray-800">{name}</td>
              <td className="px-3 py-2 text-gray-700 font-mono text-xs">{`${p.longitude.toFixed(4)}\u00B0`}</td>
              <td className="px-3 py-2 text-gray-700">{p.sign}</td>
              <td className="px-3 py-2 text-gray-700">{p.nakshatra}</td>
              <td className="px-3 py-2 text-gray-700">{p.pada}</td>
              <td className="px-3 py-2 text-gray-700">{p.star_lord}</td>
              <td className="px-3 py-2 text-gray-700 font-semibold text-amber-700">{p.sub_lord}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}