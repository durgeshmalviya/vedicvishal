"use client";

import { useEffect, useState } from "react";
import { BirthDetails, ChartOutput } from "@/lib/types"; // adjust path
import {
  fetchCurrentTransit,
  makeRelativeTransit,
  TransitRelativeResult,
} from "@/lib/api"; // adjust path
import NorthIndianChart from "@/components/NorthIndianChart";
import PlanetTable from "@/components/Planettable";       // your existing table

interface Props {
  natalChart: ChartOutput;
  birthDetails: BirthDetails;
}

export function CurrentTransitChart({ natalChart, birthDetails }: Props) {
  const [data, setData] = useState<TransitRelativeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const transit = await fetchCurrentTransit(birthDetails);
        if (!transit) throw new Error("Could not load current transit positions");
        const relative = makeRelativeTransit(natalChart, transit);
        if (!cancelled) setData(relative);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [natalChart, birthDetails]);

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading current transit (Gochar)…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Transit error: {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/40 p-3 text-sm">
        <div>
          <strong>Natal Lagna Lord:</strong> {data.lagnaLord}
          {data.lagnaLordTransitHouse != null && (
            <>
              {" "}
              · currently transiting{" "}
              <strong>
                house {data.lagnaLordTransitHouse}
              </strong>{" "}
              ({data.lagnaLordTransitSign})
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{data.note}</p>
      </div>

      <NorthIndianChart
        chart={data.chart}
        title="Current Transit (houses from natal lagna)"
      />
      <PlanetTable chart={data.chart} />
    </div>
  );
}