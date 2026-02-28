"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  LegendPayload,
} from "recharts";
import {
  Leaf,
  Map as MapIcon,
  Activity as ActivityIcon,
  Server,
  Clock,
  RefreshCw,
  ExternalLink,
  MapPinned,
  Flame,
  Image as ImageIcon,
  Database,
  Download,
  Globe,
  Bell,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  DashboardExportPayload,
  exportDashboardToCsv,
} from "@/src/utils/exportDashboardToCsv";

type ApiOk<T> = { ok: true; data: T } | { ok: false; error: string };

function safeNum(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function tsToMs(ts: any): number | null {
  if (!ts) return null;

  const sec = ts.seconds ?? ts._seconds;
  if (typeof sec === "number") return sec * 1000;

  if (typeof ts === "string") {
    const d = new Date(ts);
    const ms = d.getTime();
    return Number.isFinite(ms) ? ms : null;
  }

  return null;
}

function fmtMaybeTs(v: any) {
  if (!v) return "—";
  if (typeof v === "string") return v;

  const ms = tsToMs(v);
  if (!ms) return "—";

  return new Date(ms).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shortDate(dateStr: any) {
  const s = String(dateStr ?? "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(5); // MM-DD
  return s;
}

/** Detect container width so we can do "small screen legend = dots only" */
function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? 0;
      setW(width);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, w };
}

function CardShell({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${className}`}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {right ? <div className="text-xs text-gray-500">{right}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}

/** Modern KPI card with icon (no emojis) */
function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="
        group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm
        transition hover:shadow-md
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">
            {value}
          </div>
          {sub ? (
            <div className="mt-1 text-[11px] leading-4 text-gray-500">
              {sub}
            </div>
          ) : null}
        </div>

        <div
          className="
            flex h-11 w-11 items-center justify-center rounded-xl
            bg-gray-100 text-gray-700 transition
            group-hover:bg-[#7DBB55] group-hover:text-white
          "
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="animate-pulse">
        <div className="h-3 w-28 rounded bg-gray-200" />
        <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
        <div className="mt-3 h-3 w-40 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function ExternalServiceLink({
  title,
  desc,
  href,
  icon,
}: {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="
        group flex items-start justify-between gap-3 rounded-2xl border bg-white
        p-4 shadow-sm transition hover:shadow-md
        hover:border-[#7DBB55]/40
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl
            bg-gray-100 text-gray-700 transition
            group-hover:bg-[#7DBB55] group-hover:text-white
          "
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="mt-0.5 text-[11px] leading-4 text-gray-500">
            {desc}
          </div>
        </div>
      </div>

      <ExternalLink
        className="mt-1 text-gray-400 group-hover:text-[#7DBB55]"
        size={16}
      />
    </a>
  );
}

/** Legend: small => dots only; larger => dot + label */
function CompactLegend({
  payload,
  compact,
}: {
  payload?: ReadonlyArray<LegendPayload>;
  compact: boolean;
}) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {payload.map((entry) => {
        const color = (entry as any)?.color ?? "#999";
        const label = String((entry as any)?.value ?? "");

        return (
          <div key={label} className="flex items-center gap-1" title={label}>
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: color }}
            />
            {!compact ? (
              <span className="text-[11px] text-gray-600">{label}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ThirdPartyCredentialsNote() {
  const [showPass, setShowPass] = useState(false);
  const email = "esrdcssu@gmail.com";
  const pass = "ssusrdc@dm1n123";

  return (
    <div className="mb-3 rounded-2xl border bg-amber-50 p-4 text-amber-900">
      <div className="text-sm font-semibold">Login reminder</div>
      <div className="mt-1 text-[12px] leading-5 text-amber-800">
        Before using the third-party portals below, make sure you are logged in
        with this account:
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="rounded-xl border bg-white px-3 py-2">
          <div className="text-[11px] font-medium text-gray-500">Email</div>
          <div className="mt-0.5 text-sm font-semibold text-gray-900">
            {email}
          </div>
        </div>

        <div className="rounded-xl border bg-white px-3 py-2">
          <div className="text-[11px] font-medium text-gray-500">Password</div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <div className="min-w-0 text-sm font-semibold text-gray-900">
              {showPass ? pass : "•".repeat(12)}
            </div>

            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="inline-flex items-center justify-center rounded-lg border bg-white p-2 text-gray-700 hover:bg-gray-50 active:scale-[0.99]"
              aria-label={showPass ? "Hide password" : "Show password"}
              title={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-amber-800">
        ⚠️ Only share this with authorized admins.
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [global, setGlobal] = useState<any>(null);
  const [daily, setDaily] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [diseaseSeries, setDiseaseSeries] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // width-based compact mode (small screens)
  const { ref: containerRef, w } = useContainerWidth<HTMLDivElement>();
  const compact = w > 0 && w < 448; // < 28rem (@md)

  async function loadAll() {
    setLoading(true);
    setErr(null);

    try {
      const [g, d, u, disSeries] = await Promise.all([
        fetch("/api/admin/analytics/global").then((r) => r.json()) as Promise<
          ApiOk<any>
        >,
        fetch("/api/admin/analytics/daily?days=30").then((r) =>
          r.json(),
        ) as Promise<ApiOk<any[]>>,
        fetch("/api/admin/analytics/users-last-active?take=10").then((r) =>
          r.json(),
        ) as Promise<ApiOk<any[]>>,
        fetch("/api/admin/analytics/disease-top-timeseries?days=60").then((r) =>
          r.json(),
        ) as Promise<ApiOk<any[]>>,
      ]);

      if (!g.ok) throw new Error(g.error);
      if (!d.ok) throw new Error(d.error);
      if (!u.ok) throw new Error(u.error);
      if (!disSeries.ok) throw new Error(disSeries.error);

      setGlobal(g.data ?? null);
      setDaily(Array.isArray(d.data) ? d.data : []);
      setUsers(Array.isArray(u.data) ? u.data : []);
      setDiseaseSeries(Array.isArray(disSeries.data) ? disSeries.data : []);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // --- KPIs (top cards)
  const topCards = useMemo(() => {
    const g = global || {};
    const totalPlantScans = safeNum(g.totalPlantScans);
    const totalHealthAssessments = safeNum(g.totalHealthAssessments);

    return {
      totalPlantScans,
      totalPlantScanSuccess: safeNum(g.totalPlantScanSuccess),
      totalPlantScanFail: safeNum(g.totalPlantScanFail),

      totalMapPosts: safeNum(g.totalMapPosts),

      totalHealthAssessments,
      totalHealthSuccess: safeNum(g.totalHealthSuccess),
      totalHealthFail: safeNum(g.totalHealthFail),

      totalPlantIdRequests: totalPlantScans + totalHealthAssessments,

      lastPlantScanAt: g.lastPlantScanAt,
      lastMapPostAt: g.lastMapPostAt,
      lastHealthAssessmentAt: g.lastHealthAssessmentAt,
    };
  }, [global]);

  const dailyChart = useMemo(() => {
    return daily.map((x: any) => ({
      date: x.id,
      plantScans: safeNum(x.plantScans),
      mapPosts: safeNum(x.mapPosts),
      healthAssessments: safeNum(x.healthAssessments),
    }));
  }, [daily]);

  const plantIdRequestsChart = useMemo(() => {
    return dailyChart.map((d) => ({
      date: d.date,
      plantScans: d.plantScans,
      healthAssessments: d.healthAssessments,
      total: d.plantScans + d.healthAssessments,
    }));
  }, [dailyChart]);

  const usersLastActive = useMemo(() => {
    const now = Date.now();

    const mapped = users.map((u: any) => {
      const fullName = String(
        u.displayName ?? u.username ?? u.email ?? u.uid ?? "User",
      );
      const ms = tsToMs(u.lastActiveAt);
      const hoursAgo = ms ? Math.max(0, Math.round((now - ms) / 36e5)) : null;

      return {
        key: String(u.uid ?? fullName),
        name: fullName.slice(0, compact ? 8 : 14),
        fullName,
        email: u.email ?? null,
        hoursAgo: hoursAgo ?? 0,
        lastActiveMs: ms ?? 0,
        lastActiveLabel: ms
          ? new Date(ms).toLocaleString("en-PH", {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "numeric",
              minute: "2-digit",
            })
          : "—",
      };
    });

    return mapped.sort((a, b) => b.lastActiveMs - a.lastActiveMs);
  }, [users, compact]);

  const canDownload = !loading && !err;

  function buildExportPayload(): DashboardExportPayload {
    return {
      global: {
        totalPlantScans: Number(topCards.totalPlantScans) || 0,
        totalPlantScanSuccess: Number(topCards.totalPlantScanSuccess) || 0,
        totalPlantScanFail: Number(topCards.totalPlantScanFail) || 0,
        totalMapPosts: Number(topCards.totalMapPosts) || 0,
        totalHealthAssessments: Number(topCards.totalHealthAssessments) || 0,
        totalHealthSuccess: Number(topCards.totalHealthSuccess) || 0,
        totalHealthFail: Number(topCards.totalHealthFail) || 0,
        totalPlantIdRequests: Number(topCards.totalPlantIdRequests) || 0,
      },

      daily: dailyChart.map((d) => ({
        date: String(d.date ?? ""),
        plantScans: Number(d.plantScans) || 0,
        mapPosts: Number(d.mapPosts) || 0,
        healthAssessments: Number(d.healthAssessments) || 0,
      })),

      users: usersLastActive.map((u) => ({
        fullName: String(u.fullName ?? ""),
        email: u.email ?? null,
        lastActiveLabel: String(u.lastActiveLabel ?? "—"),
        hoursAgo: Number(u.hoursAgo) || 0,
      })),

      diseases: (Array.isArray(diseaseSeries) ? diseaseSeries : []).map(
        (d: any) => ({
          date: String(d.date ?? ""),
          totalDiseaseCount: Number(d.totalDiseaseCount) || 0,
          topDisease: d.topDisease ? String(d.topDisease) : undefined,
          topDiseaseCount:
            d.topDiseaseCount === undefined || d.topDiseaseCount === null
              ? undefined
              : Number(d.topDiseaseCount) || 0,
        }),
      ),
    };
  }

  async function handleDownloadAllCsv() {
    try {
      setDownloading(true);
      const payload = buildExportPayload();
      exportDashboardToCsv(payload);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setDownloading(false), 350);
    }
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-gray-50 @container"
    >
      <div className="w-full px-4 py-4 md:px-6 md:py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <div className="mt-1 text-xs text-gray-500">
              {loading ? "Loading…" : "Live analytics"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadAll}
              className="
                inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2
                text-xs font-medium text-gray-700 transition
                hover:bg-[#7DBB55] hover:text-white hover:border-[#7DBB55]
                active:scale-[0.99]
              "
              type="button"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={handleDownloadAllCsv}
              disabled={!canDownload || downloading}
              className="
                inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2
                text-xs font-medium text-gray-700 transition
                hover:bg-[#7DBB55] hover:text-white hover:border-[#7DBB55]
                disabled:cursor-not-allowed disabled:opacity-60
                active:scale-[0.99]
              "
              type="button"
              title={
                !canDownload ? "Load the dashboard first" : "Download CSVs"
              }
            >
              {downloading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {downloading ? "Preparing…" : "Download Report.csv"}
            </button>

            <div className="rounded-full border bg-white px-3 py-2 text-xs text-gray-600">
              {loading ? "Syncing…" : "Live"}
            </div>
          </div>
        </div>

        {err ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        {/* TOP CARDS - keep all cards */}
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                label="Total Plant Scans"
                value={topCards.totalPlantScans}
                sub={`Plants: ${topCards.totalPlantScanSuccess} • notPlants: ${topCards.totalPlantScanFail}`}
                icon={<Leaf size={20} />}
              />
              <StatCard
                label="Total Map Posts"
                value={topCards.totalMapPosts}
                icon={<MapIcon size={20} />}
              />
              <StatCard
                label="Health Assessments"
                value={topCards.totalHealthAssessments}
                sub={`Plants: ${topCards.totalHealthSuccess} • notPlants: ${topCards.totalHealthFail}`}
                icon={<ActivityIcon size={20} />}
              />
              <StatCard
                label="Plant.id Requests"
                value={topCards.totalPlantIdRequests}
                sub="Scans + health"
                icon={<Server size={20} />}
              />
              <StatCard
                label="Last Activity"
                value={<span className="text-base font-semibold">Recent</span>}
                sub={
                  <span className="block leading-5">
                    Plant: {fmtMaybeTs(topCards.lastPlantScanAt)} <br />
                    Map: {fmtMaybeTs(topCards.lastMapPostAt)} <br />
                    Health: {fmtMaybeTs(topCards.lastHealthAssessmentAt)}
                  </span>
                }
                icon={<Clock size={20} />}
              />
            </>
          )}
        </div>

        {/* ROW 1 */}
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <CardShell title="Daily Activity (last 30 days)">
            <div className="h-[280px] w-full">
              <ResponsiveContainer>
                <AreaChart
                  data={dailyChart}
                  margin={{
                    top: 10,
                    right: compact ? 6 : 20,
                    left: compact ? -10 : 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickMargin={8}
                    minTickGap={compact ? 24 : 16}
                    tickFormatter={(v) => (compact ? shortDate(v) : String(v))}
                  />
                  <YAxis width={compact ? 34 : 40} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="plantScans"
                    stroke="#16a34a"
                    fill="#16a34a"
                    fillOpacity={0.12}
                    name="Plant Scans"
                  />
                  <Area
                    type="monotone"
                    dataKey="mapPosts"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.1}
                    name="Map Posts"
                  />
                  <Area
                    type="monotone"
                    dataKey="healthAssessments"
                    stroke="#9333ea"
                    fill="#9333ea"
                    fillOpacity={0.1}
                    name="Health Assessments"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardShell>

          <CardShell title="Plant.id Requests (Daily)" right="Scans + Health">
            <div className="h-[280px] w-full">
              <ResponsiveContainer>
                <BarChart
                  data={plantIdRequestsChart}
                  margin={{
                    top: 10,
                    right: compact ? 6 : 20,
                    left: compact ? -10 : 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickMargin={8}
                    minTickGap={compact ? 24 : 16}
                    tickFormatter={(v) => (compact ? shortDate(v) : String(v))}
                  />
                  <YAxis width={compact ? 34 : 40} />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      // ✅ remove plant/plants wording here too
                      if (name === "plantScans")
                        return [value, "Scans (Plant.id)"];
                      if (name === "healthAssessments")
                        return [value, "Health (Plant.id)"];
                      return [value, String(name)];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />

                  {/* ✅ small screen legend = colors only */}
                  <Legend
                    content={(props) => (
                      <CompactLegend {...props} compact={compact} />
                    )}
                  />

                  <Bar
                    dataKey="plantScans"
                    stackId="a"
                    fill="#16a34a"
                    radius={[8, 8, 0, 0]}
                    name="Scans"
                  />
                  <Bar
                    dataKey="healthAssessments"
                    stackId="a"
                    fill="#9333ea"
                    radius={[8, 8, 0, 0]}
                    name="Health"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 text-[11px] text-gray-500">
              Total per day = Scans + Health
            </div>
          </CardShell>
        </div>

        {/* ROW 2 */}
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <CardShell title="Users Activity (Last Active)">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <div className="h-[260px] w-full">
                  <ResponsiveContainer>
                    <BarChart
                      data={usersLastActive}
                      margin={{
                        top: 10,
                        right: compact ? 6 : 20,
                        left: compact ? -10 : 0,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickMargin={8} />
                      <YAxis width={compact ? 42 : 50} />
                      <Tooltip
                        formatter={(val: any) => [
                          `${val} hour(s) ago`,
                          "Last active",
                        ]}
                      />

                      {/* ✅ small screen legend = colors only */}
                      <Legend
                        content={(props) => (
                          <CompactLegend {...props} compact={compact} />
                        )}
                      />

                      <Bar
                        dataKey="hoursAgo"
                        fill="#ef4444"
                        radius={[10, 10, 0, 0]}
                        name="Hours ago"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  Lower bar = more recent activity.
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                  {usersLastActive.length ? (
                    usersLastActive.map((u) => (
                      <div
                        key={u.key}
                        className="
                          flex items-center justify-between gap-3 rounded-xl border
                          bg-gray-50 px-3 py-2 transition
                          hover:bg-[#7DBB55] hover:text-white hover:border-[#7DBB55]
                        "
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold">
                            {u.fullName}
                          </div>
                          <div className="truncate text-[11px] opacity-80">
                            {u.email ?? "—"}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-semibold">
                            {u.lastActiveLabel}
                          </div>
                          <div className="text-[11px] opacity-80">
                            {u.hoursAgo}h ago
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      No users found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardShell>

          <CardShell title="Disease detections over time (all dates)">
            <div className="h-[320px] w-full">
              <ResponsiveContainer>
                <BarChart
                  data={diseaseSeries}
                  margin={{
                    top: 10,
                    right: compact ? 6 : 20,
                    left: compact ? -10 : 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickMargin={8}
                    minTickGap={compact ? 24 : 16}
                    tickFormatter={(v) => (compact ? shortDate(v) : String(v))}
                  />
                  <YAxis width={compact ? 34 : 40} />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === "totalDiseaseCount")
                        return [value, "Total disease counts"];
                      return [value, String(name)];
                    }}
                    labelFormatter={(label, payload) => {
                      const row: any = payload?.[0]?.payload;
                      const top = row?.topDisease
                        ? ` • top: ${row.topDisease} (${row.topDiseaseCount})`
                        : "";
                      return `Date: ${label}${top}`;
                    }}
                  />

                  {/* ✅ small screen legend = colors only */}
                  <Legend
                    content={(props) => (
                      <CompactLegend {...props} compact={compact} />
                    )}
                  />

                  <Bar
                    dataKey="totalDiseaseCount"
                    fill="#6366f1"
                    radius={[10, 10, 0, 0]}
                    name="Total disease counts"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {!diseaseSeries.length ? (
              <div className="mt-2 text-[11px] text-gray-500">
                No disease time series yet.
              </div>
            ) : null}
          </CardShell>
        </div>

        {/* ✅ Third-party stays at the VERY BOTTOM */}
        <div className="mt-4">
          <CardShell
            title="Third-party Services"
            right={
              <span className="text-[11px] text-gray-500">
                You must be logged in using the account connected to these
                services.
              </span>
            }
          >
            {/* ✅ Credentials message at TOP of this card */}
            <ThirdPartyCredentialsNote />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ExternalServiceLink
                title="Google Maps Billing"
                desc="Manage Maps API billing and usage (Google Cloud Console)."
                href="https://console.cloud.google.com/google/maps-apis/billing?project=project-93128398-92f3-4d6a-a8f"
                icon={<MapPinned size={18} />}
              />

              <ExternalServiceLink
                title="Firebase Firestore"
                desc="Open Firestore database for KalikaScan (Console)."
                href="https://console.firebase.google.com/u/0/project/kalikascan/firestore/databases/-default-/data/~2Fadmins~2F5mbjTS7lF8V8X4LtKixuDlqlSLn1"
                icon={<Database size={18} />}
              />

              <ExternalServiceLink
                title="Cloudinary Billing"
                desc="Manage Cloudinary plans, billing, and usage."
                href="https://console.cloudinary.com/app/c-ff32ec489052c9e074f8700886fa5e/settings/billing/plans"
                icon={<ImageIcon size={18} />}
              />

              <ExternalServiceLink
                title="Plant.id (Kindwise Admin)"
                desc="Manage Plant.id / Kindwise settings, usage, and keys."
                href="https://admin.kindwise.com/api_keys"
                icon={<Flame size={18} />}
              />

              <ExternalServiceLink
                title="Native Notify Dashboard"
                desc="Manage push notifications, app settings, and user tokens."
                href="https://app.nativenotify.com/dashboard"
                icon={<Bell size={18} />}
              />

              <ExternalServiceLink
                title="Vercel (Admin Hosting)"
                desc="Manage KalikaScan Admin deployments, environment variables, and builds."
                href="https://vercel.com/esrdcssu-4342s-projects"
                icon={<Globe size={18} />}
              />
            </div>

            <div className="mt-3 rounded-xl border bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              ⚠️ Reminder: Please make sure you are logged into the correct
              account that owns/uses these APIs before making any billing or key
              changes.
            </div>
          </CardShell>
        </div>
      </div>
    </div>
  );
}
