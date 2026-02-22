function safe(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

// Proper CSV escaping
function csvCell(value: string) {
  const v = safe(value);
  const escaped = v.replace(/"/g, '""');
  if (/[",\n]/.test(escaped)) return `"${escaped}"`;
  return escaped;
}

function safeInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export type DashboardExportPayload = {
  global: {
    totalPlantScans: number;
    totalPlantScanSuccess: number;
    totalPlantScanFail: number;
    totalMapPosts: number;
    totalHealthAssessments: number;
    totalHealthSuccess: number;
    totalHealthFail: number;
    totalPlantIdRequests: number;
  };

  daily: {
    date: string;
    plantScans: number;
    mapPosts: number;
    healthAssessments: number;
  }[];

  users: {
    fullName: string;
    email: string | null;
    lastActiveLabel: string;
    hoursAgo: number;
  }[];

  diseases: {
    date: string;
    totalDiseaseCount: number;
    topDisease?: string;
    topDiseaseCount?: number;
  }[];
};

export function exportDashboardToCsv(payload: DashboardExportPayload) {
  const lines: string[] = [];

  // ==============================
  // GLOBAL SUMMARY
  // ==============================
  lines.push("GLOBAL SUMMARY");
  lines.push("Metric,Value");

  lines.push(`Total Plant Scans,${safeInt(payload.global.totalPlantScans)}`);
  lines.push(
    `Plant Scan Success,${safeInt(payload.global.totalPlantScanSuccess)}`,
  );
  lines.push(`Plant Scan Fail,${safeInt(payload.global.totalPlantScanFail)}`);
  lines.push(`Total Map Posts,${safeInt(payload.global.totalMapPosts)}`);
  lines.push(
    `Total Health Assessments,${safeInt(payload.global.totalHealthAssessments)}`,
  );
  lines.push(`Health Success,${safeInt(payload.global.totalHealthSuccess)}`);
  lines.push(`Health Fail,${safeInt(payload.global.totalHealthFail)}`);
  lines.push(
    `Total Plant.id Requests,${safeInt(payload.global.totalPlantIdRequests)}`,
  );

  lines.push("");

  // ==============================
  // DAILY ACTIVITY
  // ==============================
  lines.push("DAILY ACTIVITY (Last 30 Days)");
  lines.push("Date,Plant Scans,Map Posts,Health Assessments,Plant.id Requests");

  let sumPlant = 0;
  let sumMap = 0;
  let sumHealth = 0;

  payload.daily.forEach((d) => {
    const plant = safeInt(d.plantScans);
    const map = safeInt(d.mapPosts);
    const health = safeInt(d.healthAssessments);

    sumPlant += plant;
    sumMap += map;
    sumHealth += health;

    lines.push(
      [
        csvCell(d.date),
        plant,
        map,
        health,
        plant + health, // plant.id requests
      ].join(","),
    );
  });

  // Totals row (Daily)
  lines.push(
    ["TOTAL", sumPlant, sumMap, sumHealth, sumPlant + sumHealth].join(","),
  );

  lines.push("");

  // ==============================
  // USERS LAST ACTIVE
  // ==============================
  lines.push("USERS LAST ACTIVE");
  lines.push("Name,Email,Last Active,Hours Ago");

  let sumHoursAgo = 0;
  let userCount = 0;

  payload.users.forEach((u) => {
    const hrs = safeInt(u.hoursAgo);
    sumHoursAgo += hrs;
    userCount += 1;

    lines.push(
      [
        csvCell(u.fullName),
        csvCell(u.email ?? ""),
        csvCell(u.lastActiveLabel),
        hrs,
      ].join(","),
    );
  });

  const avgHoursAgo =
    userCount > 0 ? Math.round((sumHoursAgo / userCount) * 10) / 10 : 0;

  // Totals row (Users)
  lines.push(
    ["TOTAL USERS", userCount, "AVG HOURS AGO", avgHoursAgo]
      .map((x) => csvCell(String(x)))
      .join(","),
  );

  lines.push("");

  // ==============================
  // DISEASE TIME SERIES
  // ==============================
  lines.push("DISEASE DETECTIONS OVER TIME");
  lines.push("Date,Total Disease Count,Top Disease,Top Disease Count");

  let sumDisease = 0;

  // Track overall top disease across all dates
  const diseaseAgg = new Map<string, number>();

  payload.diseases.forEach((d) => {
    const total = safeInt(d.totalDiseaseCount);
    const topName = d.topDisease ? String(d.topDisease) : "";
    const topCount = safeInt(d.topDiseaseCount ?? 0);

    sumDisease += total;

    if (topName) {
      diseaseAgg.set(topName, (diseaseAgg.get(topName) ?? 0) + topCount);
    }

    lines.push([csvCell(d.date), total, csvCell(topName), topCount].join(","));
  });

  let overallTopDisease = "";
  let overallTopDiseaseCount = 0;
  for (const [name, count] of diseaseAgg.entries()) {
    if (count > overallTopDiseaseCount) {
      overallTopDisease = name;
      overallTopDiseaseCount = count;
    }
  }

  // Totals row (Diseases)
  lines.push(
    [
      "TOTAL",
      sumDisease,
      csvCell(overallTopDisease ? `OVERALL TOP: ${overallTopDisease}` : ""),
      overallTopDiseaseCount,
    ].join(","),
  );

  // Add BOM for Excel UTF-8 support
  const csvContent = "\uFEFF" + lines.join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const fileName = `kalikascan_dashboard_report_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
