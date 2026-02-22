export type VerifyStatus =
  | "Verified"
  | "Unverified"
  | "Invalid"
  | "Invalidated by Expert";

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

function lastItem(arr: any) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[arr.length - 1];
}

function expertLabel(x: any) {
  if (!x) return "";
  if (typeof x === "string") return x;

  const name =
    x.displayName || x.username || x.email || x.name || x.uid || x.id || "";

  const email = x.email ? ` (${x.email})` : "";
  return `${name}${email}`.trim();
}

export function deriveVerifyStatus(post: any): VerifyStatus {
  // 1) system invalid (example: removed)
  if (post?.removed === true) return "Invalid";

  // 2) expert invalidation wins over validation
  const invalidated = Array.isArray(post?.invalidatedByExpert)
    ? post.invalidatedByExpert
    : [];
  if (invalidated.length > 0) return "Invalidated by Expert";

  // 3) verified by expert
  const validated = Array.isArray(post?.expertValidatedBy)
    ? post.expertValidatedBy
    : [];
  if (validated.length > 0) return "Verified";

  return "Unverified";
}

export function exportMapPostsToExcelCsv(posts: any[]) {
  const headers = [
    "User Name",
    "User Email",
    "Verify Status",
    "Expert (Verified/Invalidated By)",
    "Posted Date",
    "Address",
    "Scientific Name",
    "Taxonomy - Kingdom",
    "Taxonomy - Phylum",
    "Taxonomy - Class",
    "Taxonomy - Order",
    "Taxonomy - Family",
    "Taxonomy - Genus",
    "Coordinate - Latitude",
    "Coordinate - Longitude",
    "Caption",
    "Likes Count",
    "Comments Count",
  ];

  const lines: string[] = [];
  lines.push(headers.map(csvCell).join(","));

  for (const p of posts) {
    //  use populated user first, then fallback to userSnapshot
    const user = p?.user ?? p?.userSnapshot ?? {};
    const userName = user?.displayName || user?.username || p?.uid || "Unknown";
    const userEmail = user?.email || "";

    const status = deriveVerifyStatus(p);

    const validated = Array.isArray(p?.expertValidatedBy)
      ? p.expertValidatedBy
      : [];
    const invalidated = Array.isArray(p?.invalidatedByExpert)
      ? p.invalidatedByExpert
      : [];

    const expert =
      status === "Invalidated by Expert"
        ? expertLabel(lastItem(invalidated))
        : status === "Verified"
          ? expertLabel(lastItem(validated))
          : "";

    const address =
      p?.detailedAddress ||
      p?.addressText ||
      p?.readableLocation ||
      p?.location?.readableLocation ||
      "";

    const plant = p?.plant ?? {};
    const top = p?.topSuggestion ?? plant?.topSuggestion ?? {};
    const taxonomy = plant?.taxonomy ?? top?.taxonomy ?? {};

    const scientificName =
      plant?.scientificName || top?.name || p?.plantName || "";

    const lat = p?.location?.latitude ?? p?.latitude ?? "";
    const lon = p?.location?.longitude ?? p?.longitude ?? "";

    const likesCount = Array.isArray(p?.likes) ? p.likes.length : 0;
    const commentsCount =
      typeof p?.commentsCount === "number" ? p.commentsCount : 0;

    const row = [
      safe(userName),
      safe(userEmail),
      safe(status),
      safe(expert),
      safe(p?.createdDay ?? ""),
      safe(address),
      safe(scientificName),
      safe(taxonomy?.kingdom ?? ""),
      safe(taxonomy?.phylum ?? ""),
      safe(taxonomy?.class ?? ""),
      safe(taxonomy?.order ?? ""),
      safe(taxonomy?.family ?? ""),
      safe(taxonomy?.genus ?? ""),
      safe(lat),
      safe(lon),
      safe(p?.caption ?? ""),
      safe(likesCount),
      safe(commentsCount),
    ];

    lines.push(row.map(csvCell).join(","));
  }

  const csvContent = "\uFEFF" + lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const fileName = `map_posts_report_${new Date().toISOString().slice(0, 10)}.csv`;

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
