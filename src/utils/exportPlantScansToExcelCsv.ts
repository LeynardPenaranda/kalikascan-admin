import type { PlantScanRow } from "@/src/components/modals/PlantScanDetailsModal";

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

export function exportPlantScansToExcelCsv(scans: PlantScanRow[]) {
  const headers = [
    "Scanned By",
    "User Email",
    "Scientific Name",
    "Confidence (%)",
    "Scanned Date",
    "Address",
    "Coordinate - Latitude",
    "Coordinate - Longitude",
    "Taxonomy - Kingdom",
    "Taxonomy - Phylum",
    "Taxonomy - Class",
    "Taxonomy - Order",
    "Taxonomy - Family",
    "Taxonomy - Genus",
    "Common Names",
    "Image URLs",
  ];

  const lines: string[] = [];
  lines.push(headers.map(csvCell).join(","));

  for (const r of scans) {
    const userName =
      r.user?.displayName || r.user?.username || r.user?.email || "Unknown";

    const email = r.user?.email || "";

    const top = r.topSuggestion ?? {};
    const taxonomy = top.taxonomy ?? {};

    const scientificName = top.name ?? r.plantName ?? "";
    const confidencePct =
      typeof r.confidence === "number" ? Math.round(r.confidence * 100) : "";

    const scannedDate = r.createdDay ?? "";
    const address = r.addressText ?? "";

    // captured images / image urls
    const imageUrls = Array.isArray((r as any).imageUrls)
      ? ((r as any).imageUrls as string[])
      : Array.isArray((r as any).images)
        ? ((r as any).images as string[])
        : [];

    const row = [
      safe(userName),
      safe(email),
      safe(scientificName),
      safe(confidencePct),
      safe(scannedDate),
      safe(address),
      safe(r.latitude ?? ""),
      safe(r.longitude ?? ""),
      safe(taxonomy.kingdom ?? ""),
      safe(taxonomy.phylum ?? ""),
      safe(taxonomy.class ?? ""),
      safe(taxonomy.order ?? ""),
      safe(taxonomy.family ?? ""),
      safe(taxonomy.genus ?? ""),
      joinList(top.common_names),
      safe(imageUrls.join(" | ")),
    ];

    lines.push(row.map(csvCell).join(","));
  }

  const csvContent = "\uFEFF" + lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const fileName = `plant_scans_report_${new Date()
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
