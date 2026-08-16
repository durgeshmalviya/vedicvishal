"use client";

import { ChartOutput } from "@/lib/types";
import { PLANET_ABBR } from "@/lib/types";
import { houseFromSign } from "@/lib/calculations";

interface Props {
  chart: ChartOutput;
  title: string;
  size?: number;
}

/**
 * Fixed polygon coordinates for the 12 houses of a classic North Indian
 * (diamond) Vedic chart, drawn on a 400x400 viewBox. House 1 is always the
 * top-center diamond; houses run clockwise from there.
 */
const HOUSE_POLYGONS: Record<number, string> = {
  1: "200,0 300,100 200,200 100,100",
  2: "0,0 200,0 100,100",
  3: "0,0 100,100 0,200",
  4: "0,200 100,100 200,200 100,300",
  5: "0,200 100,300 0,400",
  6: "0,400 100,300 200,400",
  7: "200,400 100,300 200,200 300,300",
  8: "200,400 300,300 400,400",
  9: "400,400 300,300 400,200",
  10: "400,200 300,300 200,200 300,100",
  11: "400,200 300,100 400,0",
  12: "400,0 300,100 200,0",
};

/** Approximate label anchor (x, y) for each house, tuned for readability. */
const HOUSE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 75 },
  2: { x: 100, y: 35 },
  3: { x: 40, y: 95 },
  4: { x: 100, y: 200 },
  5: { x: 40, y: 305 },
  6: { x: 100, y: 365 },
  7: { x: 200, y: 325 },
  8: { x: 300, y: 365 },
  9: { x: 360, y: 305 },
  10: { x: 300, y: 200 },
  11: { x: 360, y: 95 },
  12: { x: 300, y: 35 },
};

// Planet colors for professional styling
const PLANET_COLORS: Record<string, string> = {
  Sun: "#d97706",      // Orange
  Moon: "#7c3aed",     // Purple
  Mars: "#dc2626",     // Red
  Mercury: "#0891b2",  // Cyan
  Jupiter: "#ea580c",  // Orange-red
  Venus: "#ec4899",    // Pink
  Saturn: "#6b7280",   // Gray
  Rahu: "#8b5a2b",     // Brown
  Ketu: "#8b5a2b",     // Brown
};

export default function NorthIndianChart({ chart, title, size = 380 }: Props) {
  const asc = chart.ascendant;
  const ascSign = asc?.current_sign ?? 1;
  const planets = chart.planets || {};

  // Group planets (+ ascendant marker) by house number
  const planetsByHouse: Record<number, { name: string; abbr: string; retro: boolean; degree: string }[]> = {};
  for (let h = 1; h <= 12; h++) planetsByHouse[h] = [];

  Object.entries(planets).forEach(([name, data]) => {
    const house = data.house_number || houseFromSign(data.current_sign, ascSign);
    if (house >= 1 && house <= 12) {
      planetsByHouse[house].push({
        name: name,
        abbr: PLANET_ABBR[name] || name.slice(0, 2),
        retro: data.isRetro === "true" || (data.isRetro as unknown) === true,
        degree: `${data.degrees}°${String(data.minutes).padStart(2, "0")}'`,
      });
    }
  });

  const signOfHouse = (house: number) => ((ascSign - 1 + (house - 1)) % 12) + 1;

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-semibold text-amber-800 mb-4">{title}</h3>
      <svg
        viewBox="0 0 400 400"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-lg shadow-md"
      >
        {/* Gradient background */}
        <defs>
          <linearGradient id="chartBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffdf6" />
            <stop offset="100%" stopColor="#fef9e7" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="400" height="400" fill="url(#chartBg)" stroke="#d4af85" strokeWidth="2.5" />

        {Object.entries(HOUSE_POLYGONS).map(([house, points]) => (
          <polygon
            key={house}
            points={points}
            fill="none"
            stroke="#d4af85"
            strokeWidth="1.8"
            opacity="0.9"
          />
        ))}

        {Array.from({ length: 12 }, (_, i) => i + 1).map((house) => {
          const pos = HOUSE_LABEL_POS[house];
          const occupants = planetsByHouse[house];
          const sign = signOfHouse(house);
          const isAscHouse = house === 1;

          return (
            <g key={house}>
              {/* House Number - Small and positioned at corner */}
              <text
                x={pos.x - 28}
                y={pos.y - 20}
                fontSize="11"
                fill="#8b6f47"
                textAnchor="middle"
                fontWeight="700"
                opacity="0.85"
              >
                {house}
              </text>

              {/* Ascendant marker */}
              {isAscHouse && (
                <text
                  x={pos.x}
                  y={pos.y - 28}
                  fontSize="9"
                  fill="#c0392b"
                  textAnchor="middle"
                  fontWeight="800"
                >
                  Asc
                </text>
              )}

              {/* Planet abbreviations + degree, stacked with better spacing */}
              {(() => {
                const rowHeight = 22; // Increased spacing between planets
                const startY = pos.y + (isAscHouse ? 8 : -8) - ((occupants.length - 1) * rowHeight) / 2;

                return occupants.map((p, idx) => {
                  const planetColor = PLANET_COLORS[p.name] || "#6b7280";
                  const yPos = startY + idx * rowHeight;

                  return (
                    <g key={idx}>
                      {/* Planet abbreviation - Bold */}
                      <text
                        x={pos.x}
                        y={yPos}
                        fontSize="13"
                        fill={planetColor}
                        textAnchor="middle"
                        fontWeight="800"
                        fontFamily="Georgia, serif"
                        letterSpacing="1"
                      >
                        {p.abbr}
                        {p.retro && (
                          <tspan baselineShift="sub" fontSize="8">
                            Rx
                          </tspan>
                        )}
                      </text>

                      {/* Degree - Bold and prominent */}
                      <text
                        x={pos.x}
                        y={yPos + 12}
                        fontSize="8.5"
                        fill={planetColor}
                        textAnchor="middle"
                        fontWeight="900"
                        opacity="0.95"
                        letterSpacing="0.5"
                      >
                        {p.degree}
                      </text>
                    </g>
                  );
                });
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
}