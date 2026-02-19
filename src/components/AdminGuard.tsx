"use client";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/src/lib/firebase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FullPageLoader from "./ui/FullPageLoader";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAllowed(false);
        setReady(true);
        router.replace("/");
        return;
      }

      const token = await user.getIdTokenResult(true);
      const isAdmin = Boolean(token.claims.admin);

      setAllowed(isAdmin);
      setReady(true);

      if (!isAdmin) {
        await auth.signOut();
        router.replace("/");
      }
    });

    return () => unsub();
  }, [router]);

  if (!ready) return <FullPageLoader />;
  if (!allowed) return null;

  return <>{children}</>;
}
