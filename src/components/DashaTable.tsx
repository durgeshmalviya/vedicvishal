"use client";

import { CurrentDashaResponse, VimshottariResponse } from "@/lib/types";

interface Props {
  dasha: VimshottariResponse["output"] | undefined;
  currentDasha: CurrentDashaResponse["output"] | undefined;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function DashaTable({ dasha, currentDasha }: Props) {
  if (!dasha?.mahadashas?.length) {
    return <p className="text-sm text-gray-400 text-center py-6">Dasha data not available for this Kundli yet.</p>;
  }

  const now = new Date();
  const mahadashas = dasha.mahadashas;

  return (
    <div className="space-y-6">
      {currentDasha && (currentDasha.mahadasha || currentDasha.antardasha || currentDasha.pratyantardasha) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Mahadasha", period: currentDasha.mahadasha },
            { label: "Antardasha", period: currentDasha.antardasha },
            { label: "Pratyantardasha", period: currentDasha.pratyantardasha },
          ].map(
            (row) =>
              row.period && (
                <div key={row.label} className="p-4 rounded-xl bg-amber-50/70 border border-amber-100">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{row.label}</div>
                  <div className="font-semibold text-amber-800 text-lg">{row.period.lord}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {fmtDate(row.period.start)} &rarr; {fmtDate(row.period.end)}
                  </div>
                </div>
              )
          )}
        </div>
      )}

      {dasha.balance && (
        <p className="text-xs text-gray-500">
          Balance of {dasha.balance.lord} Dasha at birth: {(dasha.balance.remaining_fraction * 100).toFixed(1)}%
          remaining (&asymp; {dasha.balance.balance_years.toFixed(2)} years)
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-amber-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-amber-50 text-gray-600 text-xs uppercase tracking-wide">
              <th className="text-left px-3 py-2.5">Mahadasha Lord</th>
              <th className="text-left px-3 py-2.5">Start</th>
              <th className="text-left px-3 py-2.5">End</th>
              <th className="text-left px-3 py-2.5">Duration</th>
            </tr>
          </thead>
          <tbody>
            {mahadashas.map((p, i) => {
              const isCurrent = now >= new Date(p.start) && now < new Date(p.end);
              return (
                <tr
                  key={i}
                  className={isCurrent ? "bg-amber-100/80 font-semibold" : i % 2 ? "bg-white" : "bg-amber-50/40"}
                >
                  <td className="px-3 py-2 text-gray-800">
                    {p.lord}
                    {isCurrent && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-400 text-white">Current</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{fmtDate(p.start)}</td>
                  <td className="px-3 py-2 text-gray-700">{fmtDate(p.end)}</td>
                  <td className="px-3 py-2 text-gray-700">{(p.duration_days / 365.25).toFixed(2)} yrs</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
