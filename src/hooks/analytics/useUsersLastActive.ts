"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import { isTs } from "@/src/utils/formatTs";

export type UserLastActiveRow = {
  uid: string;
  displayName: string;
  email: string | null;
  lastActiveAt: Timestamp | null;
};

export function useUsersLastActive(opts?: { take?: number }) {
  const take = opts?.take ?? 10;

  const [users, setUsers] = useState<UserLastActiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const qy = query(
        collection(db, "users"),
        orderBy("lastActiveAt", "desc"),
        limit(take),
      );

      const snap = await getDocs(qy);

      setUsers(
        snap.docs.map((d) => {
          const x = d.data() as any;
          return {
            uid: d.id,
            displayName: x.displayName ?? x.username ?? "Unknown",
            email: x.email ?? null,
            lastActiveAt: isTs(x.lastActiveAt) ? x.lastActiveAt : null,
          };
        }),
      );
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load /users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [take]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const chartData = useMemo(() => {
    const now = Date.now();
    return users.map((u) => {
      const ms = u.lastActiveAt?.toDate?.()?.getTime?.() ?? 0;
      const hoursAgo = ms ? Math.max(0, Math.round((now - ms) / 36e5)) : 0;
      return {
        name: (u.displayName || u.email || u.uid).slice(0, 14),
        hoursAgo,
        fullName: u.displayName,
        email: u.email,
      };
    });
  }, [users]);

  return { users, chartData, loading, error, refresh };
}
