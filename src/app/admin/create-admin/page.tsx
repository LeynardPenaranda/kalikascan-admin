"use client";

import { auth } from "@/src/lib/firebase/client";
import { useState } from "react";

export default function CreateAdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);

    try {
      const current = auth.currentUser;
      if (!current) throw new Error("Not logged in");

      const token = await current.getIdToken(true);

      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed");

      setMsg(`Created admin successfully. UID: ${data.uid}`);
      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (e: any) {
      setErr(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>Create New Admin</h1>

      <form onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <input
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Temporary password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {err && <p style={{ color: "crimson" }}>{err}</p>}
        {msg && <p style={{ color: "green" }}>{msg}</p>}

        <button disabled={loading} type="submit">
          {loading ? "Creating..." : "Create Admin"}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14 }}>
        Tip: You can force new admins to reset password later using Firebase
        Auth “password reset email”.
      </p>
    </div>
  );
}
