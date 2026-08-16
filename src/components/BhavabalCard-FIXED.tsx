import React, { useMemo } from "react";

interface BhavaData {
  sign: string;
  balaPoints: number;
  percentStrength: number;
  remarks: string;
}

interface BhavabalaCardProps {
  bhavabala: {
    bhava: {
      [key: number]: BhavaData;
    };
  } | null | undefined;
  kundliId?: string;
}

interface ProcessedHouse {
  house: number;
  totalBala: number;
  rupas: number;
  ratio: number;
  percent: number;
  sign: string;
  remarks: string;
  ranking: number;
}

export default function BhavabalaCard({
  bhavabala,
}: BhavabalaCardProps) {
  if (!bhavabala?.bhava) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Loading Bhavabala data...</p>
      </div>
    );
  }

  const bhavaData = bhavabala.bhava;
  const houses = Array.from({ length: 12 }, (_, i) => i + 1);

  const processed = useMemo<ProcessedHouse[]>(() => {
    const list: ProcessedHouse[] = houses.map((h) => {
      const data = bhavaData[h];
      const totalBala = data?.balaPoints ? data.balaPoints * 10 : 0;
      const rupas = Math.round(totalBala / 60);
      const ratio = rupas >= 8 ? 2 : 1;

      return {
        house: h,
        totalBala: Math.round(totalBala),
        rupas,
        ratio,
        percent: data?.percentStrength ?? 0,
        sign: data?.sign ?? "-",
        remarks: data?.remarks ?? "",
        ranking: 0,
      };
    });

    const sorted = [...list].sort((a, b) => b.totalBala - a.totalBala);

    sorted.forEach((item, idx) => {
      const original = list.find((l) => l.house === item.house);
      if (original) original.ranking = idx + 1;
    });

    return list;
  }, [bhavaData]);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-amber-50 border-b-2 border-amber-200">
            <th className="px-4 py-3 text-left font-bold text-gray-700">
              COMPONENT
            </th>
            {houses.map((h) => (
              <th
                key={h}
                className="px-3 py-3 text-center font-bold text-gray-700"
              >
                H{h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr className="border-b border-gray-100 bg-yellow-50">
            <td className="px-4 py-3 font-semibold text-gray-800">
              Total Bhava Bala
            </td>
            {processed.map((p) => (
              <td key={p.house} className="px-3 py-3 text-center font-medium">
                {p.totalBala}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-100">
            <td className="px-4 py-3 font-semibold text-gray-800">
              Bhava Bala (Rupas)
            </td>
            {processed.map((p) => (
              <td key={p.house} className="px-3 py-3 text-center">
                {p.rupas}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-100">
            <td className="px-4 py-3 font-semibold text-gray-800">
              Strength Ratio
            </td>
            {processed.map((p) => (
              <td key={p.house} className="px-3 py-3 text-center font-medium">
                {p.ratio}
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-100">
            <td className="px-4 py-3 font-semibold text-gray-800">Ranking</td>
            {processed.map((p) => (
              <td key={p.house} className="px-3 py-3 text-center">
                {p.ranking}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 border-t">
        Higher Total Bhava Bala and Ranking indicate stronger houses. Strength
        Ratio 2 = strong, 1 = moderate.
      </div>
    </div>
  );
}