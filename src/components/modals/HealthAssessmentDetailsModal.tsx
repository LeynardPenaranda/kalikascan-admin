"use client";

import { useEffect, useMemo, useState } from "react";
import { X, AlertTriangle, BarChart3, HelpCircle } from "lucide-react";
import SimilarImagesCarousel from "../SimilarImagesCarousel";
import ImageCarousel from "../ImageCarousel";

export type DiseaseTreatment = {
  biological?: string[];
  chemical?: string[];
  prevention?: string[];
};

export type DiseaseDetails = {
  local_name?: string | null;
  description?: string | null;
  treatment?: DiseaseTreatment | null;
  url?: string | null;
};

export type SimilarImage = {
  url: string;
  similarity?: number | null; // 0..1
  citation?: string | null; // owner/provider
  license_name?: string | null;
  license_url?: string | null;
};

export type PlantIdDiseaseSuggestion = {
  id?: string | null;
  name?: string | null;
  probability?: number | null;
  details?: DiseaseDetails | null;
  similar_images?: SimilarImage[] | null;
};

export type HealthAssessmentRow = {
  id: string;
  uid: string;

  createdDay?: string | null;
  createdAt?: any;

  user?: {
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;

  imageUrls?: string[] | null;

  // health signals
  isHealthyBinary?: boolean | null;
  isHealthyProbability?: number | null;
  isPlantProbability?: number | null;

  // top disease
  diseaseName?: string | null;
  confidence?: number | null; // sample: 0.5317
  topDisease?: PlantIdDiseaseSuggestion | null;
  diseaseSuggestions?: PlantIdDiseaseSuggestion[] | null;

  questionText?: string | null;

  // location
  addressText?: string | null;
  location?: { latitude?: number | null; longitude?: number | null } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  assessment: HealthAssessmentRow | null;
};

function normalizeProbability(raw: any): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  const normalized = raw > 1 ? raw / 100 : raw;
  return Math.max(0, Math.min(1, normalized));
}

function getConfidence(p?: number | null) {
  if (typeof p !== "number") return null;
  const clamped = Math.max(0, Math.min(1, p));
  const percent = Math.round(clamped * 100);

  if (clamped >= 0.85)
    return {
      value: clamped,
      percent,
      label: "High" as const,
      color: "#2E7D32",
      bg: "#E8F5E9",
      border: "#C8E6C9",
    };

  if (clamped >= 0.6)
    return {
      value: clamped,
      percent,
      label: "Medium" as const,
      color: "#F9A825",
      bg: "#FFF8E1",
      border: "#FFECB3",
    };

  return {
    value: clamped,
    percent,
    label: "Low" as const,
    color: "#C62828",
    bg: "#FFEBEE",
    border: "#FFCDD2",
  };
}

function Pill({
  label,
  percent,
  tone,
}: {
  label: string;
  percent: number;
  tone: ReturnType<typeof getConfidence>;
}) {
  if (!tone) return null;
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold"
      style={{
        backgroundColor: tone.bg,
        borderColor: tone.border,
        color: tone.color,
      }}
    >
      <BarChart3 size={14} />
      <span>
        Confidence: {label} · {percent}%
      </span>
    </div>
  );
}

function TreatmentBlock({
  title,
  items,
}: {
  title: string;
  items?: string[] | null;
}) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="mt-2 rounded-xl bg-gray-100/70 p-3">
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
          {items.map((t, idx) => (
            <li key={`${title}-${idx}`}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DiseaseCard({
  d,
  index,
}: {
  d: PlantIdDiseaseSuggestion;
  index: number;
}) {
  const prob = normalizeProbability(d.probability) ?? 0;
  const conf = getConfidence(prob);

  const pillBg = conf?.label === "Low" ? "#FFEBEE" : (conf?.bg ?? "#f3f4f6");
  const pillBorder =
    conf?.label === "Low" ? "#FFCDD2" : (conf?.border ?? "#e5e7eb");
  const pillText =
    conf?.label === "Low" ? "#C62828" : (conf?.color ?? "#374151");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold text-gray-900">
          {index + 1}. {d.details?.local_name || d.name || "Unknown disease"}
        </div>

        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold"
          style={{
            backgroundColor: pillBg,
            borderColor: pillBorder,
            color: pillText,
          }}
        >
          <BarChart3 size={14} />
          <span>
            {conf?.label ?? "—"} · {conf?.percent ?? 0}%
          </span>
        </div>
      </div>

      {!!d.details?.description && (
        <div className="mt-3 rounded-xl bg-gray-100/70 p-3 text-sm text-gray-800">
          {d.details.description}
        </div>
      )}

      <TreatmentBlock
        title="Biological treatment"
        items={d.details?.treatment?.biological ?? null}
      />
      <TreatmentBlock
        title="Chemical treatment"
        items={d.details?.treatment?.chemical ?? null}
      />
      <TreatmentBlock
        title="Prevention"
        items={d.details?.treatment?.prevention ?? null}
      />

      {Array.isArray(d.similar_images) && d.similar_images.length > 0 ? (
        <SimilarImagesCarousel
          items={d.similar_images.map((img) => ({
            url: img.url,
            similarity: img.similarity ?? null,
            citation: img.citation ?? null,
            license_name: img.license_name ?? null,
            license_url: img.license_url ?? null,
          }))}
        />
      ) : null}

      {d.details?.url ? (
        <a
          href={d.details.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-xs text-blue-600 hover:underline"
        >
          Learn more
        </a>
      ) : null}
    </div>
  );
}

export default function HealthAssessmentDetailsModal({
  open,
  onClose,
  assessment,
}: Props) {
  // ✅ NO API CALLS: use selected row data directly
  const [data, setData] = useState<HealthAssessmentRow | null>(assessment);

  useEffect(() => {
    setData(assessment);
  }, [assessment]);

  const images = useMemo(() => data?.imageUrls ?? [], [data]);

  const isHealthy = data?.isHealthyBinary ?? null;

  const confidenceProb = useMemo(() => {
    if (!data) return null;

    // prefer row confidence if present
    const rowConf = normalizeProbability(data.confidence);
    if (rowConf != null) return rowConf;

    if (data.isHealthyBinary === true)
      return normalizeProbability(data.isHealthyProbability);

    if (data.isHealthyBinary === false)
      return normalizeProbability(data.topDisease?.probability);

    return normalizeProbability(data.isPlantProbability);
  }, [data]);

  const confidence = useMemo(
    () => getConfidence(confidenceProb),
    [confidenceProb],
  );

  // ✅ admin side wording: "User" (not "You")
  const userLabel =
    data?.user?.displayName ||
    data?.user?.username ||
    data?.user?.email ||
    data?.uid ||
    "Unknown user";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/40 flex items-end justify-center"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl bg-white rounded-t-2xl max-h-[92vh] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              Health Assessment
            </div>
            <div className="text-xs text-gray-500 truncate">
              User:{" "}
              <span className="font-medium text-gray-700">{userLabel}</span>
              {data?.createdDay ? (
                <>
                  <span className="mx-2 text-gray-300">•</span>
                  <span>{data.createdDay}</span>
                </>
              ) : null}
              {data?.id ? (
                <>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="font-mono">{data.id}</span>
                </>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 inline-flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-auto max-h-[calc(92vh-56px)]">
          {!data ? (
            <div className="py-10 text-center text-gray-600">
              <div className="inline-flex items-center gap-2 text-red-600">
                <AlertTriangle size={18} />
                <span>No health assessment found.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User-captured images */}
              <ImageCarousel images={images} />

              {/* Title */}
              <div className="text-center space-y-2">
                <div className="text-xl font-semibold text-gray-900">
                  {isHealthy === true
                    ? "Plant looks healthy 🌿"
                    : "Plant may be unhealthy 🩺"}
                </div>

                <div className="text-sm text-gray-600">
                  {isHealthy === true
                    ? "No major disease signals detected."
                    : "Most likely issues based on the captured photo(s)."}
                </div>

                {confidence ? (
                  <div className="flex justify-center">
                    <Pill
                      label={confidence.label}
                      percent={confidence.percent}
                      tone={confidence}
                    />
                  </div>
                ) : null}

                {/* ✅ Removed low-confidence warning UI */}
              </div>

              {!!data.questionText && isHealthy === false ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 flex gap-2 text-sm text-gray-800">
                  <HelpCircle size={18} className="mt-0.5" />
                  <div>{data.questionText}</div>
                </div>
              ) : null}

              {isHealthy === true ? (
                <div className="rounded-xl bg-gray-100/70 p-3 text-sm text-gray-800">
                  Note: This result is based on the provided image(s). If the
                  plant condition changes or photos are unclear, additional
                  scans may help.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-base font-semibold text-gray-900">
                    Possible diseases / issues
                  </div>

                  {(data.diseaseSuggestions ?? []).length > 0 ? (
                    <div className="space-y-3">
                      {(data.diseaseSuggestions ?? [])
                        .slice(0, 5)
                        .map((d, idx) => (
                          <DiseaseCard
                            key={d.id ?? `${idx}`}
                            d={d}
                            index={idx}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 text-center">
                      No disease suggestions returned.
                    </div>
                  )}
                </div>
              )}

              {/* Optional: Location block (nice for admin) */}
              {(data.addressText ||
                (data.location?.latitude != null &&
                  data.location?.longitude != null)) && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">
                    Capture location
                  </div>

                  {data.addressText ? (
                    <div className="mt-2 text-sm text-gray-700">
                      {data.addressText}
                    </div>
                  ) : null}

                  {data.location?.latitude != null &&
                  data.location?.longitude != null ? (
                    <div className="mt-2 text-xs text-gray-600">
                      Lat:{" "}
                      <span className="font-mono">
                        {data.location.latitude}
                      </span>{" "}
                      • Lon:{" "}
                      <span className="font-mono">
                        {data.location.longitude}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
