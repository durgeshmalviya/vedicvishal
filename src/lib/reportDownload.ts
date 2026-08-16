/**
 * Builds the complete downloadable Kundli report as a PDF, styled to match
 * the app's amber/gold Vedic theme. Pulls together the profile header,
 * D1 planetary positions, dasha, doshas/yogas, and the numerology section.
 *
 * Requires: npm install jspdf html2canvas
 */

import { ChartOutput } from "./types";
import { NumerologyProfile } from "./numerologys";
import { SadeSatiResult, MangalDoshResult, YogaResult, BhagyaPhalResult, signName } from "./calculations";

const THEME = {
  cream: "#FFFEFB",
  creamMid: "#FCF7EC",
  creamDeep: "#F8F1E2",
  gold: "#C88955",
  goldDeep: "#8A542E",
  goldLight: "#E6C79E",
  border: "#E8D8C2",
  ink: "#2F241C",
  sub: "#8A542E",
};

interface ReportInput {
  kundli: { name: string; gender: string; date: string; time: string; place: string };
  chart: ChartOutput;
  sadeSati: SadeSatiResult | null;
  mangalDosh: MangalDoshResult;
  yogas: YogaResult[];
  bhagyaPhal: BhagyaPhalResult | null;
  numerology: NumerologyProfile;
}

export async function generateFullReportPDF(input: ReportInput): Promise<void> {
  const jsPDFModule = await import("jspdf");
  const html2canvasModule = await import("html2canvas");
  const { jsPDF } = jsPDFModule;
  const html2canvas = html2canvasModule.default;

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "1000px";
  container.style.backgroundColor = THEME.cream;
  container.style.padding = "0";
  container.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

  container.innerHTML = buildReportHTML(input);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: THEME.cream,
      useCORS: true,
      logging: false,
      windowWidth: 1000,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${input.kundli.name.replace(/\s+/g, "_")}_Kundli_Report.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function section(title: string, inner: string): string {
  return `
    <div style="margin-bottom:26px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        <div style="height:1px;width:28px;background:${THEME.gold};"></div>
        <span style="font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${THEME.sub};">${title}</span>
        <div style="height:1px;flex:1;background:${THEME.border};"></div>
      </div>
      ${inner}
    </div>
  `;
}

function planetRows(chart: ChartOutput): string {
  const planets = chart.planets || {};
  const asc = chart.ascendant;
  const rows = Object.entries(planets)
    .map(([name, p]: [string, any]) => {
      return `
        <tr style="border-bottom:1px solid ${THEME.border};">
          <td style="padding:8px 10px;font-size:12px;font-weight:600;color:${THEME.ink};">${name}</td>
          <td style="padding:8px 10px;font-size:12px;color:#555;">${signName(p.current_sign)}</td>
          <td style="padding:8px 10px;font-size:12px;color:#555;">${p.house_number ?? "—"}</td>
          <td style="padding:8px 10px;font-size:12px;color:#555;">${p.nakshatra_name ?? "—"}</td>
          <td style="padding:8px 10px;font-size:12px;color:#555;">${p.isRetro === "true" ? "Retrograde" : "Direct"}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="background:${THEME.creamMid};border-radius:10px;padding:14px 16px;margin-bottom:14px;">
      <div style="font-size:11px;color:${THEME.sub};text-transform:uppercase;letter-spacing:1px;">Lagna (Ascendant)</div>
      <div style="font-size:18px;font-weight:700;color:${THEME.ink};margin-top:4px;">${asc ? signName(asc.current_sign) : "—"}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:${THEME.creamDeep};">
          <th style="padding:8px 10px;text-align:left;font-size:10.5px;color:${THEME.sub};text-transform:uppercase;">Planet</th>
          <th style="padding:8px 10px;text-align:left;font-size:10.5px;color:${THEME.sub};text-transform:uppercase;">Sign</th>
          <th style="padding:8px 10px;text-align:left;font-size:10.5px;color:${THEME.sub};text-transform:uppercase;">House</th>
          <th style="padding:8px 10px;text-align:left;font-size:10.5px;color:${THEME.sub};text-transform:uppercase;">Nakshatra</th>
          <th style="padding:8px 10px;text-align:left;font-size:10.5px;color:${THEME.sub};text-transform:uppercase;">Motion</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function doshaCards(sadeSati: SadeSatiResult | null, mangalDosh: MangalDoshResult): string {
  const sadeSatiCard = sadeSati
    ? `
      <div style="flex:1;background:${sadeSati.inSadeSati ? "#FEF2F2" : "#F0FDF4"};border:1px solid ${sadeSati.inSadeSati ? "#FECACA" : "#BBF7D0"};border-radius:10px;padding:14px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${sadeSati.inSadeSati ? "#B91C1C" : "#15803D"};">Sade Sati</div>
        <div style="font-size:13px;font-weight:600;color:${THEME.ink};margin-top:6px;">${sadeSati.inSadeSati ? sadeSati.phaseLabel : "Not currently active"}</div>
      </div>
    `
    : "";

  const mangalCard = `
    <div style="flex:1;background:${mangalDosh.overall ? "#FEF2F2" : "#F0FDF4"};border:1px solid ${mangalDosh.overall ? "#FECACA" : "#BBF7D0"};border-radius:10px;padding:14px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${mangalDosh.overall ? "#B91C1C" : "#15803D"};">Mangal Dosh</div>
      <div style="font-size:13px;font-weight:600;color:${THEME.ink};margin-top:6px;">${mangalDosh.overall ? "Present" : "Not detected"}</div>
    </div>
  `;

  return `<div style="display:flex;gap:14px;">${sadeSatiCard}${mangalCard}</div>`;
}

function yogaList(yogas: YogaResult[]): string {
  const present = yogas.filter((y) => y.present);
  if (present.length === 0) {
    return `<p style="font-size:12.5px;color:#777;">No classical yogas detected from the checks performed.</p>`;
  }
  return present
    .map(
      (y) => `
      <div style="background:${THEME.creamMid};border-left:3px solid ${THEME.gold};border-radius:8px;padding:12px 14px;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:700;color:${THEME.ink};">${y.name}</div>
        <div style="font-size:11.5px;color:#666;margin-top:4px;line-height:1.5;">${y.description}</div>
      </div>
    `
    )
    .join("");
}

function numerologyBlock(numerology: NumerologyProfile): string {
  const cards = [
    { label: "Life Path", value: numerology.lifePath, desc: numerology.descriptions.lifePath },
    { label: "Destiny", value: numerology.destiny, desc: numerology.descriptions.destiny },
    { label: "Soul Urge", value: numerology.soulUrge, desc: numerology.descriptions.soulUrge },
    { label: "Personality", value: numerology.personality, desc: numerology.descriptions.personality },
  ];

  const cardHtml = cards
    .map(
      (c) => `
      <div style="flex:1;min-width:0;background:${THEME.creamMid};border:1px solid ${THEME.border};border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:10px;color:${THEME.sub};text-transform:uppercase;letter-spacing:1px;">${c.label}</div>
        <div style="font-size:26px;font-weight:800;color:${THEME.goldDeep};margin:6px 0;">${c.value}</div>
        <div style="font-size:10.5px;color:#666;line-height:1.4;">${c.desc.slice(0, 90)}${c.desc.length > 90 ? "…" : ""}</div>
      </div>
    `
    )
    .join("");

  const yearsRows = numerology.years
    .map(
      (y, idx) => `
      <tr style="background:${idx % 2 === 0 ? THEME.creamMid : "transparent"};">
        <td style="padding:6px 10px;font-size:11.5px;color:${THEME.ink};font-weight:600;">${y.year}</td>
        <td style="padding:6px 10px;font-size:14px;font-weight:700;color:${THEME.goldDeep};text-align:center;">${y.personalYear}</td>
        <td style="padding:6px 10px;font-size:11px;color:#666;">${y.description}</td>
      </tr>
    `
    )
    .join("");

  return `
    <div style="display:flex;gap:12px;margin-bottom:16px;">${cardHtml}</div>
    <div style="background:${THEME.creamMid};border-radius:10px;padding:14px 16px;margin-bottom:14px;display:flex;justify-content:space-around;text-align:center;">
      <div>
        <div style="font-size:10px;color:${THEME.sub};text-transform:uppercase;">Personal Year</div>
        <div style="font-size:24px;font-weight:800;color:${THEME.goldDeep};">${numerology.personalYear}</div>
      </div>
      <div>
        <div style="font-size:10px;color:${THEME.sub};text-transform:uppercase;">Personal Month</div>
        <div style="font-size:24px;font-weight:800;color:${THEME.goldDeep};">${numerology.personalMonth}</div>
      </div>
      <div>
        <div style="font-size:10px;color:${THEME.sub};text-transform:uppercase;">Personal Day</div>
        <div style="font-size:24px;font-weight:800;color:${THEME.goldDeep};">${numerology.personalDay}</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="padding:6px 10px;text-align:left;font-size:10px;color:${THEME.sub};text-transform:uppercase;">Year</th>
          <th style="padding:6px 10px;text-align:center;font-size:10px;color:${THEME.sub};text-transform:uppercase;">Number</th>
          <th style="padding:6px 10px;text-align:left;font-size:10px;color:${THEME.sub};text-transform:uppercase;">Theme</th>
        </tr>
      </thead>
      <tbody>${yearsRows}</tbody>
    </table>
  `;
}

function buildReportHTML(input: ReportInput): string {
  const { kundli, chart, sadeSati, mangalDosh, yogas, bhagyaPhal, numerology } = input;

  return `
    <div style="padding:36px 40px;">
      <!-- Cover header -->
      <div style="text-align:center;border-bottom:2px solid ${THEME.gold};padding-bottom:22px;margin-bottom:28px;">
        <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${THEME.sub};margin-bottom:8px;">AstroKundli</div>
        <div style="font-size:30px;font-weight:800;color:${THEME.ink};letter-spacing:1px;">Vedic Birth Chart Report</div>
      </div>

      ${section(
        "Profile",
        `
        <div style="display:flex;gap:14px;">
          ${[
            ["Name", kundli.name],
            ["Gender", kundli.gender],
            ["Date of Birth", kundli.date],
            ["Time", kundli.time],
          ]
            .map(
              ([label, value]) => `
              <div style="flex:1;background:${THEME.creamMid};border:1px solid ${THEME.border};border-radius:10px;padding:12px 14px;">
                <div style="font-size:10px;color:${THEME.sub};text-transform:uppercase;letter-spacing:1px;">${label}</div>
                <div style="font-size:14px;font-weight:700;color:${THEME.ink};margin-top:4px;">${value}</div>
              </div>
            `
            )
            .join("")}
        </div>
        <div style="margin-top:10px;font-size:12px;color:#666;">Birth Place: ${kundli.place}</div>
        `
      )}

      ${section("D1 Lagna Chart — Planetary Positions", planetRows(chart))}

      ${section("Doshas", doshaCards(sadeSati, mangalDosh))}

      ${section("Yogas Present", yogaList(yogas))}

      ${
        bhagyaPhal
          ? section(
              "Bhagya Phal",
              `
              <div style="background:${THEME.creamMid};border-radius:10px;padding:16px;">
                <p style="font-size:12.5px;color:${THEME.ink};line-height:1.6;margin:0;">${bhagyaPhal.summary}</p>
              </div>
            `
            )
          : ""
      }

      ${section("Numerology Analysis", numerologyBlock(numerology))}

      <div style="text-align:center;margin-top:30px;padding-top:16px;border-top:1px solid ${THEME.border};font-size:10.5px;color:#999;">
        Generated on ${new Date().toLocaleDateString()} · AstroKundli — for guidance and reflection, not a substitute for professional advice.
      </div>
    </div>
  `;
}