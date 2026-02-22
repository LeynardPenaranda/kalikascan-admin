"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import { isTs, n } from "@/src/utils/formatTs";

export type GlobalAnalytics = {
  lastHealthAssessmentAt: Timestamp | null;
  lastMapPostAt: Timestamp | null;
  lastPlantScanAt: Timestamp | null;

  totalHealthAssessments: number;
  totalHealthFail: number;
  totalHealthSuccess: number;

  totalMapPosts: number;

  totalPlantScanFail: number;
  totalPlantScanSuccess: number;
  totalPlantScans: number;
};

export function useGlobalAnalytics() {
  const [data, setData] = useState<GlobalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ref = doc(db, "analytics", "global");
      const snap = await getDoc(ref);

      const g = (snap.exists() ? snap.data() : {}) as any;

      setData({
        lastHealthAssessmentAt: isTs(g.lastHealthAssessmentAt)
          ? g.lastHealthAssessmentAt
          : null,
        lastMapPostAt: isTs(g.lastMapPostAt) ? g.lastMapPostAt : null,
        lastPlantScanAt: isTs(g.lastPlantScanAt) ? g.lastPlantScanAt : null,

        totalHealthAssessments: n(g.totalHealthAssessments),
        totalHealthFail: n(g.totalHealthFail),
        totalHealthSuccess: n(g.totalHealthSuccess),

        totalMapPosts: n(g.totalMapPosts),

        totalPlantScanFail: n(g.totalPlantScanFail),
        totalPlantScanSuccess: n(g.totalPlantScanSuccess),
        totalPlantScans: n(g.totalPlantScans),
      });
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load /analytics/global");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
