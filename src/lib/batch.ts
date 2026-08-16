import {
  BirthDetails,
  ChartOutput,
  CurrentDashaResponse,
  KpChartResponse,
  VimshottariResponse,
} from "./types";
import {
  generateKundali,
  fetchVimshottariDasha,
  fetchCurrentDasha,
  fetchKpChart,
  fetchShodashvarga,
  fetchDivisional,
  normalizeChart,
} from "./api";
import { KundliRecord, putKundli } from "./db";

export type BatchProgress = {
  step: string;
  done: number;
  total: number;
};

const DIVISIONS = [2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];

/**
 * Parallel batch load of D1 + Dasha + KP + all Vargas.
 * Skips sections already present on the record (IndexedDB cache hit).
 */
export async function loadFullKundliBatch(
  record: KundliRecord,
  onProgress?: (p: BatchProgress) => void
): Promise<KundliRecord> {
  const details = record as unknown as BirthDetails;
  let updated: KundliRecord = { ...record, cache: { ...(record.cache || {}) } };
  const total = 4;
  let done = 0;

  const tick = (step: string) => {
    done += 1;
    onProgress?.({ step, done, total });
  };

  // D1
  if (!updated.data) {
    onProgress?.({ step: "Lagna chart (D1)", done, total });
    const res = await generateKundali(details);
    updated.data = res.output;
    updated.cache!.d1 = true;
  }
  updated.vargas = {
    ...((updated.vargas as Record<string, ChartOutput>) || {}),
    d1: updated.data as ChartOutput,
  };
  tick("D1 ready");

  // Parallel wave: Dasha + KP + Vargas
  onProgress?.({ step: "Dasha · KP · Vargas (parallel)", done, total });

  const jobs: Promise<void>[] = [];

  if (!updated.dasha || !updated.currentDasha) {
    jobs.push(
      (async () => {
        try {
          const [vim, cur] = await Promise.all([
            fetchVimshottariDasha(details),
            fetchCurrentDasha(details),
          ]);
          updated.dasha = vim.output;
          updated.currentDasha = cur.output;
          updated.cache!.dasha = true;
        } catch (e) {
          console.warn("[batch] dasha", e);
        }
      })()
    );
  } else {
    updated.cache!.dasha = true;
  }

  if (!updated.kp) {
    jobs.push(
      (async () => {
        try {
          const res = await fetchKpChart(details);
          updated.kp = res.output;
          updated.cache!.kp = true;
        } catch (e) {
          console.warn("[batch] kp", e);
        }
      })()
    );
  } else {
    updated.cache!.kp = true;
  }

  const vargaCount = Object.keys(
    (updated.vargas as object) || {}
  ).filter((k) => k !== "d1").length;

  if (vargaCount < 4) {
    jobs.push(
      (async () => {
        const vargas: Record<string, ChartOutput> = {
          ...((updated.vargas as Record<string, ChartOutput>) || {}),
        };
        if (updated.data) vargas.d1 = updated.data as ChartOutput;

        try {
          const all = await fetchShodashvarga(details);
          for (const [rawKey, v] of Object.entries(all.output || {})) {
            const key = rawKey.toLowerCase().replace(/[^a-z0-9]/g, "");
            const normalized = normalizeChart(v);
            if (!normalized) continue;
            const match = key.match(/d(\d+)/) || key.match(/(\d+)/);
            if (match) vargas[`d${match[1]}`] = normalized;
            else vargas[key] = normalized;
          }
        } catch {
          await Promise.all(
            DIVISIONS.map(async (d) => {
              try {
                const res = await fetchDivisional(details, d);
                const normalized =
                  normalizeChart(res.output) || normalizeChart(res);
                if (normalized) vargas[`d${d}`] = normalized;
              } catch {
                /* skip */
              }
            })
          );
        }

        updated.vargas = vargas;
        updated.cache!.vargas = true;
      })()
    );
  } else {
    updated.cache!.vargas = true;
  }

  await Promise.all(jobs);
  tick("Batch complete");

  updated.updatedAt = new Date().toISOString();
  await putKundli(updated);
  return updated;
}

export function isFullyCached(r: KundliRecord): boolean {
  return !!(
    r.data &&
    r.dasha &&
    r.currentDasha &&
    r.kp &&
    r.vargas &&
    Object.keys(r.vargas as object).length >= 5
  );
}
