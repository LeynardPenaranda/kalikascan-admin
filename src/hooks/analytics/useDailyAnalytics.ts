"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  FieldPath,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import { isTs, n } from "@/src/utils/formatTs";

export type DailyRow = {
  date: string; // doc id YYYY-MM-DD
  plantScans: number;
  mapPosts: number;
  healthAssessments: number;
  successCount: number;
  failCount: number;
  healthSuccessCount: number;
  healthFailCount: number;
  lastUpdatedAt: Timestamp | null;
};

export function useDailyAnalytics(opts?: { days?: number }) {
  const days = opts?.days ?? 30;

  const [rows, setRows] = useState<DailyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const qy = query(
        collection(db, "analytics", "global", "daily"),
        orderBy("__name__", "asc"),
        limit(365), // grab enough then slice last N
      );

      const snap = await getDocs(qy);

      const all = snap.docs.map((d) => {
        const x = d.data() as any;
        return {
          date: d.id,
          plantScans: n(x.plantScans),
          mapPosts: n(x.mapPosts),
          healthAssessments: n(x.healthAssessments),
          successCount: n(x.successCount),
          failCount: n(x.failCount),
          healthSuccessCount: n(x.healthSuccessCount),
          healthFailCount: n(x.healthFailCount),
          lastUpdatedAt: isTs(x.lastUpdatedAt) ? x.lastUpdatedAt : null,
        } as DailyRow;
      });

      // keep last N by date (already asc)
      setRows(all.slice(Math.max(0, all.length - days)));
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load /analytics/global/daily");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        date: r.date,
        plantScans: r.plantScans,
        mapPosts: r.mapPosts,
        healthAssessments: r.healthAssessments,
        successTotal: r.successCount + r.healthSuccessCount,
        failTotal: r.failCount + r.healthFailCount,
      })),
    [rows],
  );

  const lastUpdatedAt = rows.length
    ? rows[rows.length - 1].lastUpdatedAt
    : null;

  return { rows, chartData, lastUpdatedAt, loading, error, refresh };
}
