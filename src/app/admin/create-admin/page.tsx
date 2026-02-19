"use client";

import { DEFAULT_ADMIN_AVATAR } from "@/src/constant";
import { useToast } from "@/src/hooks/useToast";
import { auth } from "@/src/lib/firebase/client";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AdminRole = "admin" | "superadmin";

type AdminRow = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  disabled: boolean;
  createdAt: string | null;
  lastSignIn: string | null;
  role: AdminRole;
};

function getInitials(nameOrEmail?: string | null) {
  const s = String(nameOrEmail ?? "").trim();
  if (!s) return "A";
  const base = s.includes("@") ? s.split("@")[0] : s;
  const parts = base.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "A";
  const second = parts.length > 1 ? parts[1]?.[0] : "";
  return (first + second).toUpperCase();
}

function Avatar({
  src,
  label,
}: {
  src?: string | null;
  label?: string | null;
}) {
  const [imgOk, setImgOk] = useState(true);
  const initials = getInitials(label);
  const finalSrc = src || DEFAULT_ADMIN_AVATAR;

  return (
    <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
      {imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={finalSrc}
          alt="avatar"
          className="h-full w-full object-cover"
          onError={() => setImgOk(false)}
        />
      ) : (
        <span className="text-xs font-semibold text-gray-600">{initials}</span>
      )}
    </div>
  );
}

function AdminRowItem({ a, isMe }: { a: AdminRow; isMe: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar src={a.photoURL} label={a.displayName || a.email} />

        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-sm font-semibold text-app-headerText truncate">
              {a.displayName || "No display name"}
            </div>

            {isMe && (
              <span className="text-[11px] px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                you
              </span>
            )}
          </div>

          <div className="text-xs text-app-text truncate">
            {a.email || "No email"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={[
            "text-[11px] px-2 py-1 rounded-full border",
            a.disabled
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-green-50 text-green-700 border-green-200",
          ].join(" ")}
        >
          {a.disabled ? "Disabled" : "Active"}
        </span>
      </div>
    </div>
  );
}

export default function CreateAdminPage() {
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [role, setRole] = useState<AdminRole>("admin");

  const [loading, setLoading] = useState(false);

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const [myUid, setMyUid] = useState<string | null>(null);

  const superAdmins = useMemo(
    () => admins.filter((a) => a.role === "superadmin"),
    [admins],
  );
  const normalAdmins = useMemo(
    () => admins.filter((a) => a.role === "admin"),
    [admins],
  );

  const totalCount = admins.length;

  async function resolveMyRoleAndUid() {
    const current = auth.currentUser;
    if (!current) return;

    setMyUid(current.uid);

    const token = await current.getIdTokenResult(true);
    setIsSuperAdmin(Boolean(token.claims.superadmin));

    setRole("admin");
  }

  async function fetchAdmins() {
    try {
      setLoadingAdmins(true);

      const current = auth.currentUser;
      if (!current) throw new Error("Not logged in");

      const token = await current.getIdToken(true);

      const res = await fetch("/api/admin/list-admins", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to fetch admins");

      setAdmins(Array.isArray(data?.admins) ? data.admins : []);
    } catch (e: any) {
      showToast({
        type: "danger",
        message: "Failed to load admins",
        description: e?.message ?? "Something went wrong",
      });
    } finally {
      setLoadingAdmins(false);
    }
  }

  useEffect(() => {
    resolveMyRoleAndUid();
    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
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
        body: JSON.stringify({
          email,
          password,
          displayName,
          photoURL: DEFAULT_ADMIN_AVATAR,
          role: isSuperAdmin ? role : "admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed");

      showToast({
        type: "success",
        message: "Admin created successfully",
        description: `${displayName || email} can now log in using the temporary password.`,
      });

      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole("admin");

      fetchAdmins();
    } catch (e: any) {
      let message = "Failed to create admin";
      let description = e?.message ?? "Something went wrong";

      if (description.includes("email-already-exists"))
        description = "An account with this email already exists.";
      if (description.includes("invalid-email"))
        description = "Please enter a valid email address.";
      if (description.includes("weak-password"))
        description = "Password should be at least 6 characters.";

      showToast({ type: "danger", message, description });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center gap-6 p-4">
      {/*  TOP: ADMIN LISTS */}
      <div className="w-[95%] bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden">
        <div className="px-8 pt-7 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-app-headerText">
              Admins{" "}
              <span className="text-xs font-normal text-app-text">
                ({totalCount})
              </span>
            </h2>
            <p className="text-sm text-app-text mt-1">
              Super Admins and Admins with access to the KalikaScan Admin Panel.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAdmins}
            disabled={loadingAdmins}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh admins"
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${loadingAdmins ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="border-t border-gray-100" />

        {/* scroll area */}
        <div className="px-8 py-5">
          <div className="max-h-[50vh] overflow-y-auto space-y-6 pr-1">
            {loadingAdmins ? (
              <div className="text-sm text-app-text">Loading admins...</div>
            ) : totalCount === 0 ? (
              <div className="text-sm text-app-text">No admins found.</div>
            ) : (
              <>
                {/*  SUPERADMINS */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-app-headerText">
                      Super Admins{" "}
                      <span className="text-xs font-normal text-app-text">
                        ({superAdmins.length})
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                      superadmin
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {superAdmins.length === 0 ? (
                      <div className="text-sm text-app-text">
                        No superadmins found.
                      </div>
                    ) : (
                      superAdmins.map((a) => (
                        <AdminRowItem
                          key={a.uid}
                          a={a}
                          isMe={Boolean(myUid && a.uid === myUid)}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/*  ADMINS */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-app-headerText">
                      Admins{" "}
                      <span className="text-xs font-normal text-app-text">
                        ({normalAdmins.length})
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                      admin
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {normalAdmins.length === 0 ? (
                      <div className="text-sm text-app-text">
                        No admins found.
                      </div>
                    ) : (
                      normalAdmins.map((a) => (
                        <AdminRowItem
                          key={a.uid}
                          a={a}
                          isMe={Boolean(myUid && a.uid === myUid)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/*  BOTTOM: CREATE ADMIN CARD */}
      <div className="w-[520px] max-w-[95vw] bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden">
        <div className="px-8 pt-8 pb-5">
          <h1 className="text-2xl font-semibold text-app-headerText">
            Register New Admin
          </h1>
          <p className="text-sm text-app-text mt-1">
            Add another administrator to manage the KalikaScan system.
          </p>
        </div>

        <div className="border-t border-gray-100" />

        <form onSubmit={onCreate} className="px-8 py-6 space-y-4">
          {/*  Role dropdown (ONLY for superadmin) */}
          {isSuperAdmin && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-app-headerText">
                Role
              </label>
              <select
                className="w-full rounded-lg border border-app-inputBorder px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-app-button focus:border-app-button transition bg-white cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <p className="text-[11px] text-app-text">
                Only Super Admins can assign roles.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-app-headerText">
              Display Name
            </label>
            <input
              className="w-full rounded-lg border border-app-inputBorder px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-app-button focus:border-app-button transition"
              placeholder="Juan Dela Cruz"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-app-headerText">
              Admin Email
            </label>
            <input
              className="w-full rounded-lg border border-app-inputBorder px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-app-button focus:border-app-button transition"
              placeholder="admin@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-app-headerText">
              Temporary Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-app-inputBorder px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-app-button focus:border-app-button transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-lg bg-app-button text-white py-2.5 text-sm font-medium hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Register New Admin"}
          </button>
        </form>

        <div className="border-t border-gray-100" />

        <div className="px-8 py-5 bg-app-primarySoft/40 text-xs text-app-text">
          <strong>Admin Setup Tip:</strong> The password you assign here is only
          temporary. After giving the account to the new admin, ask them to
          enter their email on the login page first, then click
          <span className="font-medium"> “Forgot password?” </span>
          to create their own secure password.
        </div>
      </div>
    </div>
  );
}
