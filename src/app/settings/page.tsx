"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Health = {
  ok?: boolean;
  apiKeyConfigured?: boolean;
  keySource?: string;
  keyPrefix?: string;
  navamshaProbe?: { status: number; success: boolean; detail?: unknown };
  hint?: string;
};

export default function SettingsPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [checking, setChecking] = useState(false);

  const runCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      setHealth(await res.json());
    } catch (e) {
      setHealth({
        ok: false,
        hint: `Health check failed: ${e instanceof Error ? e.message : String(e)}. Is npm run dev running?`,
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-yellow-50">
      <header className="border-b border-amber-100 bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-amber-600">
            <span className="text-lg">←</span>
            <span className="font-medium">Back</span>
          </Link>
          <span className="font-bold text-gray-800">Settings & API</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">API key dependency</h1>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            AstroKundli calculates charts through the{" "}
            <strong>Navamsha</strong> Swiss-Ephemeris API. The key is read only on the
            server from environment variables — it is never exposed to the browser.
          </p>

          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm space-y-2">
            <p className="font-semibold text-amber-900">Required environment variable</p>
            <pre className="bg-white rounded-lg px-3 py-2 text-xs overflow-x-auto border border-amber-100">
{`NAVAMSHA_API_KEY=your_key_here`}
            </pre>
            <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
              <li>
                Local: create <code className="text-xs bg-white px-1 rounded">.env.local</code> in
                the project root, then restart <code className="text-xs">npm run dev</code>
              </li>
              <li>
                Vercel: Project → Settings → Environment Variables → add{" "}
                <code className="text-xs">NAVAMSHA_API_KEY</code> for Production & Preview
              </li>
              <li>
                Free key (no card):{" "}
                <a
                  className="text-amber-700 underline"
                  href="https://www.navamsha.in/auth/signup"
                  target="_blank"
                  rel="noreferrer"
                >
                  www.navamsha.in/auth/signup
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Live connection status</h2>
            <button
              onClick={runCheck}
              disabled={checking}
              className="px-3 py-1.5 text-sm rounded-lg bg-amber-400 text-gray-900 font-medium hover:bg-amber-500 disabled:opacity-60"
            >
              {checking ? "Checking…" : "Re-check"}
            </button>
          </div>

          {!health ? (
            <p className="text-gray-400 text-sm">Running probe…</p>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Overall</dt>
                <dd className={health.ok ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
                  {health.ok ? "Connected" : "Not connected"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Key configured</dt>
                <dd>{health.apiKeyConfigured ? "Yes" : "No"}</dd>
              </div>
              {health.keySource && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Key source</dt>
                  <dd className="font-mono text-xs">{health.keySource}</dd>
                </div>
              )}
              {health.keyPrefix && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Key prefix</dt>
                  <dd className="font-mono text-xs">{health.keyPrefix}</dd>
                </div>
              )}
              {health.navamshaProbe && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Navamsha probe</dt>
                  <dd>
                    HTTP {health.navamshaProbe.status}{" "}
                    {health.navamshaProbe.success ? "✓" : "✗"}
                  </dd>
                </div>
              )}
              {health.hint && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mt-2">
                  {health.hint}
                </p>
              )}
            </dl>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm text-sm text-gray-600 space-y-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Caching</h2>
          <p>
            Generated kundlis are stored in <strong>IndexedDB</strong> (with localStorage
            backup). Reopening a kundli uses the cache and only refetches missing sections.
          </p>
          <p>
            Parallel batch loading fetches D1, Dasha, KP, and Vargas together so every tab is
            ready after the first open.
          </p>
        </section>
      </main>
    </div>
  );
}
