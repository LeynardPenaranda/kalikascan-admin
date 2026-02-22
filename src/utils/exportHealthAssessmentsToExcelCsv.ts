import type { HealthAssessmentRow } from "@/src/components/modals/HealthAssessmentDetailsModal";

function safe(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function joinList(list: any) {
  if (!Array.isArray(list)) return "";
  return list
    .filter((x) => typeof x === "string" && x.trim().length > 0)
    .join(", ");
}

// Proper CSV escaping
function csvCell(value: string) {
  const v = safe(value);
  const escaped = v.replace(/"/g, '""');
  if (/[",\n]/.test(escaped)) return `"${escaped}"`;
  return escaped;
}

function pctNumber(n: number | null | undefined) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "";
  return String(Math.round(n * 100));
}

export function exportHealthAssessmentsToExcelCsv(
  items: HealthAssessmentRow[],
) {
  const headers = [
    "Assessed By",
    "User Email",
    "Created Day",
    "Is Healthy",
    "Confidence (%)",
    "Is Plant Probability (%)",
    "Is Healthy Probability (%)",
    "Top Disease",
    "Top Disease Probability (%)",
    "Address",
    "Coordinate - Latitude",
    "Coordinate - Longitude",
    "Image URLs",
    "Disease Suggestions (names)",
  ];

  const lines: string[] = [];
  lines.push(headers.map(csvCell).join(","));

  for (const r of items) {
    const userName =
      r.user?.displayName || r.user?.username || r.user?.email || "Unknown";

    const email = r.user?.email || "";

    const lat = r.location?.latitude ?? "";
    const lon = r.location?.longitude ?? "";

    const topDiseaseName =
      r.diseaseName ||
      r.topDisease?.details?.local_name ||
      r.topDisease?.name ||
      "";

    const topDiseaseProb = r.topDisease?.probability ?? null;

    const suggestionNames = (r.diseaseSuggestions ?? [])
      .map((d) => d.details?.local_name || d.name)
      .filter(Boolean) as string[];

    const imageUrls = Array.isArray(r.imageUrls) ? r.imageUrls : [];

    const row = [
      safe(userName),
      safe(email),
      safe(r.createdDay ?? ""),
      r.isHealthyBinary == null ? "" : r.isHealthyBinary ? "Yes" : "No",
      pctNumber(r.confidence ?? null),
      pctNumber(r.isPlantProbability ?? null),
      pctNumber(r.isHealthyProbability ?? null),
      safe(topDiseaseName),
      pctNumber(topDiseaseProb ?? null),
      safe(r.addressText ?? ""),
      safe(lat),
      safe(lon),
      safe(imageUrls.join(" | ")),
      joinList(suggestionNames),
    ];

    lines.push(row.map(csvCell).join(","));
  }

  const csvContent = "\uFEFF" + lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const fileName = `health_assessments_report_${new Date()
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
