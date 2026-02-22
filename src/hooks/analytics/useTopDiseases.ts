"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  FieldPath,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import { n } from "@/src/utils/formatTs";

export type TopDiseaseRow = { name: string; count: number };

export function useTopDiseases(opts?: { take?: number }) {
  const take = opts?.take ?? 10;

  const [date, setDate] = useState<string>("");
  const [rows, setRows] = useState<TopDiseaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // pick latest date doc in /analytics/global/diseaseTop
      const topQ = query(
        collection(db, "analytics", "global", "diseaseTop"),
        orderBy("__name__", "desc"),
        limit(1),
      );
      const topSnap = await getDocs(topQ);

      if (topSnap.empty) {
        setDate("");
        setRows([]);
        return;
      }

      const latest = topSnap.docs[0];
      const latestDate = latest.id;
      setDate(latestDate);

      // fetch diseases subcollection
      const diseasesSnap = await getDocs(
        collection(
          db,
          "analytics",
          "global",
          "diseaseTop",
          latestDate,
          "diseases",
        ),
      );

      const list = diseasesSnap.docs
        .map((d) => {
          const x = d.data() as any;
          // prefer count, fallback if you used something else
          const count = n(x.count ?? x.total ?? x.value ?? 0);
          return { name: d.id, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, take);

      setRows(list);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load diseaseTop");
      setDate("");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [take]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const chartData = useMemo(() => rows, [rows]);

  return { date, rows, chartData, loading, error, refresh };
}
