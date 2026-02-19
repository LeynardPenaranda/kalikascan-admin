"use client";

import { auth } from "@/src/lib/firebase/client";

export default function AdminHome() {
  return (
    <div className="h-full bg-red-500">
      <h1>KalikaScan Admin Dashboard</h1>

      <button onClick={() => auth.signOut()}>Logout</button>

      <p style={{ marginTop: 16 }}>
        Next step: read totals like total scans, reports, etc.
      </p>
    </div>
  );
}
