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

/** -------------------- ✅ TAXONOMY DEEP SEARCH (FIX) -------------------- */

type FlatTaxonomy = {
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
};

function valueToName(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    return String(v);

  // common shapes: { name }, { value }, { scientificName }, etc.
  return (
    v?.name ??
    v?.value ??
    v?.scientificName ??
    v?.scientific_name ??
    v?.label ??
    ""
  );
}

function normalizeTaxonomy(input: any): FlatTaxonomy {
  const out: FlatTaxonomy = {};
  if (!input) return out;

  // Case A: array taxonomy: [{rank:"kingdom", name:"Plantae"}...]
  if (Array.isArray(input)) {
    for (const item of input) {
      const rank = String(item?.rank ?? item?.type ?? item?.level ?? "")
        .toLowerCase()
        .trim();
      const name = valueToName(
        item?.name ?? item?.value ?? item?.taxon ?? item,
      );
      if (!rank || !name) continue;

      if (rank === "kingdom") out.kingdom = name;
      else if (rank === "phylum") out.phylum = name;
      else if (rank === "class") out.class = name;
      else if (rank === "order") out.order = name;
      else if (rank === "family") out.family = name;
      else if (rank === "genus") out.genus = name;
    }
    return out;
  }

  // Case B: object taxonomy
  const t = input;

  // some APIs use className/class_name/_class/etc
  const classVal =
    t?.class ??
    t?.className ??
    t?.class_name ??
    t?.["class-name"] ??
    t?._class ??
    t?.clazz ??
    null;

  out.kingdom = valueToName(t?.kingdom ?? t?.Kingdom ?? t?.KINGDOM);
  out.phylum = valueToName(t?.phylum ?? t?.Phylum ?? t?.PHYLUM);
  out.class = valueToName(classVal);
  out.order = valueToName(t?.order ?? t?.Order ?? t?.ORDER);
  out.family = valueToName(t?.family ?? t?.Family ?? t?.FAMILY);
  out.genus = valueToName(t?.genus ?? t?.Genus ?? t?.GENUS);

  return out;
}

function scoreTaxonomyCandidate(x: any): number {
  if (!x) return 0;

  // array candidate
  if (Array.isArray(x)) {
    let hits = 0;
    for (const it of x) {
      const r = String(it?.rank ?? it?.type ?? it?.level ?? "").toLowerCase();
      if (
        ["kingdom", "phylum", "class", "order", "family", "genus"].includes(r)
      )
        hits++;
    }
    return hits;
  }

  // object candidate
  if (typeof x !== "object") return 0;

  const keys = Object.keys(x).map((k) => k.toLowerCase());
  const wanted = ["kingdom", "phylum", "class", "order", "family", "genus"];

  let hits = 0;
  for (const w of wanted) {
    if (
      keys.includes(w) ||
      keys.includes(`${w}name`) ||
      keys.includes(`${w}_name`) ||
      keys.includes(`${w}-name`)
    ) {
      hits++;
    }
  }
  return hits;
}

// Deep search anywhere in the post for taxonomy-like shape
function findTaxonomyDeep(root: any): FlatTaxonomy {
  const seen = new Set<any>();
  let best: any = null;
  let bestScore = 0;

  function walk(node: any, depth: number) {
    if (!node || depth > 10) return;
    if (typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    const s = scoreTaxonomyCandidate(node);
    if (s > bestScore) {
      bestScore = s;
      best = node;
    }

    if (Array.isArray(node)) {
      for (const it of node) walk(it, depth + 1);
    } else {
      for (const k of Object.keys(node)) walk(node[k], depth + 1);
    }
  }

  walk(root, 0);
  return normalizeTaxonomy(best);
}

/** -------------------- ✅ EXPORT -------------------- */

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
    // use populated user first, then fallback to userSnapshot
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

    const scientificName =
      plant?.scientificName || top?.name || p?.plantName || "";

    // ✅ FIX: deep-search taxonomy anywhere in the post
    const taxonomy = findTaxonomyDeep(p);

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
      safe(taxonomy.kingdom ?? ""),
      safe(taxonomy.phylum ?? ""),
      safe(taxonomy.class ?? ""),
      safe(taxonomy.order ?? ""),
      safe(taxonomy.family ?? ""),
      safe(taxonomy.genus ?? ""),
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
