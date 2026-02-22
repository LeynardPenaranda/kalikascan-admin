"use client";

import React from "react";
import { X } from "lucide-react";
import type {
  ExpertApplication,
  ExpertApplicationStatus,
} from "./ExpertApplicationsModal";

function fmtDateTime(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

function statusPill(status: ExpertApplicationStatus) {
  if (status === "approved")
    return "bg-green-50 text-green-700 border-green-200";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function Info({
  label,
  value,
  link,
}: {
  label: string;
  value?: string | null;
  link?: boolean;
}) {
  const v = value || "—";
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-gray-900 break-words">
        {link && value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            {v}
          </a>
        ) : (
          v
        )}
      </div>
    </div>
  );
}

export default function ExpertApplicationReviewModal({
  open,
  app,
  loading,
  adminNote,
  setAdminNote,
  onClose,
  onApprove,
  onReject,
}: {
  open: boolean;
  app: ExpertApplication | null;
  loading: boolean;
  adminNote: string;
  setAdminNote: (v: string) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (!open || !app) return null;

  const alreadyReviewed =
    app.status === "approved" || app.status === "rejected";
  const disableActions = loading || alreadyReviewed;

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!loading) onClose();
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-black/10 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  Review application
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${statusPill(
                    app.status,
                  )}`}
                >
                  {app.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {app.displayName || "Unnamed"} • {app.email || app.uid}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 max-h-[70vh] overflow-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Info label="UID" value={app.uid} />
              <Info label="Email" value={app.email} />
              <Info label="Phone" value={app.phoneNumber} />
              <Info label="Location" value={app.location} />
              <Info label="Organization" value={app.organization} />
              <Info label="Profession" value={app.profession} />
              <Info label="Specialization" value={app.specialization} />
              <Info
                label="Years experience"
                value={
                  typeof app.yearsExperience === "number"
                    ? String(app.yearsExperience)
                    : ((app.yearsExperience as any) ?? null)
                }
              />
              <Info label="Credentials link" value={app.credentialsLink} link />
              <Info label="Applied at" value={fmtDateTime(app.createdAt)} />
              <Info label="Reviewed at" value={fmtDateTime(app.reviewedAt)} />
              <Info label="Reviewed by" value={app.reviewedBy} />
            </div>

            <div className="mt-4">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Applicant note
              </div>
              <div className="rounded-xl border border-gray-200 p-3 text-sm text-gray-800 bg-gray-50 whitespace-pre-wrap">
                {app.note || "—"}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Admin note (optional)
              </div>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-black/5 disabled:bg-gray-50"
                rows={3}
                placeholder="Write a note for this decision (optional)…"
                disabled={loading || alreadyReviewed}
              />
              {alreadyReviewed ? (
                <div className="text-xs text-gray-500 mt-2">
                  This application has already been {app.status}.
                </div>
              ) : null}
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-50"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReject}
                disabled={disableActions}
                className="rounded-lg border border-red-200 text-red-700 bg-red-50 px-4 py-2 text-sm hover:bg-red-100 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Working…" : alreadyReviewed ? "Reject" : "Reject"}
              </button>

              <button
                type="button"
                onClick={onApprove}
                disabled={disableActions}
                className="rounded-lg border border-green-200 text-green-700 bg-green-50 px-4 py-2 text-sm hover:bg-green-100 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Working…" : alreadyReviewed ? "Approve" : "Approve"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
