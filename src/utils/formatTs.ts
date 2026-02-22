import { Timestamp } from "firebase/firestore";

export function isTs(v: any): v is Timestamp {
  return v && typeof v === "object" && typeof v.toDate === "function";
}

export function fmtTs(v?: Timestamp | null) {
  if (!v || !isTs(v)) return "—";
  return v.toDate().toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
