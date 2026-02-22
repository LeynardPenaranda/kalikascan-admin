"use client";

import React, { useMemo } from "react";
import { RefreshCw, X, Trash2 } from "lucide-react";

export type ExpertApplicationStatus = "pending" | "approved" | "rejected";

export type ExpertApplication = {
  id: string;

  uid: string;
  displayName: string | null;
  email: string | null;

  phoneNumber?: string | null;
  location?: string | null;
  organization?: string | null;
  profession?: string | null;
  specialization?: string | null;
  yearsExperience?: number | null;
  credentialsLink?: string | null;

  note?: string | null;
  adminNote?: string | null;

  status: ExpertApplicationStatus;

  createdAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
};

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

function statusLabel(status: ExpertApplicationStatus) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

export default function ExpertApplicationsModal({
  open,
  loading,
  items,
  onClose,
  onSelect,
  onRefresh,
  onDelete,
}: {
  open: boolean;
  loading: boolean;
  items: ExpertApplication[];
  onClose: () => void;
  onSelect: (app: ExpertApplication) => void;
  onRefresh: () => void;
  onDelete: (app: ExpertApplication) => void;
}) {
  const pendingCount = useMemo(
    () => items.filter((x) => x.status === "pending").length,
    [items],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* fixed height modal container */}
        <div className="w-full max-w-3xl h-[78vh] sm:h-[72vh] rounded-2xl bg-white shadow-2xl border border-black/10 overflow-hidden flex flex-col">
          {/* Header (fixed) */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  Expert applications
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                  Pending: {pendingCount}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Click an application to review.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-50"
                disabled={loading}
              >
                <span className="inline-flex items-center gap-2">
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 active:scale-[0.98] transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List header row (fixed) */}
          <div className="px-5 py-2 border-b border-gray-100 bg-white">
            <div className="grid grid-cols-12 gap-3 text-[11px] font-medium text-gray-500">
              <div className="col-span-6">Applicant</div>
              <div className="col-span-3">Applied</div>
              <div className="col-span-2 text-right">Status</div>
              <div className="col-span-1 text-right"> </div>
            </div>
          </div>

          {/* Scroll area (only this scrolls) */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-3 py-2">
              {loading ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Loading applications…
                </div>
              ) : items.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  No applications found.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((a) => {
                    const canDelete =
                      a.status === "approved" || a.status === "rejected";

                    return (
                      <div
                        key={a.id}
                        className="rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition"
                      >
                        {/*  ROW is NOT a button anymore (prevents nested button) */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelect(a)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelect(a);
                            }
                          }}
                          className="w-full text-left px-4 py-3 cursor-pointer"
                        >
                          <div className="grid grid-cols-12 gap-3 items-center">
                            {/* Applicant */}
                            <div className="col-span-6 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {a.displayName || "Unnamed"}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {a.email || a.uid}
                              </div>
                            </div>

                            {/* Applied */}
                            <div className="col-span-3">
                              <div className="text-xs text-gray-600">
                                {fmtDateTime(a.createdAt)}
                              </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-2 flex justify-end">
                              <span
                                className={`text-xs px-2 py-1 rounded-full border ${statusPill(
                                  a.status,
                                )}`}
                              >
                                {statusLabel(a.status)}
                              </span>
                            </div>

                            {/* Delete icon */}
                            <div className="col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={(e) => {
                                  //  keep row click from triggering
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (canDelete) onDelete(a);
                                }}
                                disabled={!canDelete}
                                title={
                                  canDelete
                                    ? "Delete application"
                                    : "Only approved/rejected can be deleted"
                                }
                                className="p-2 rounded-lg border border-gray-200 hover:bg-white active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="h-4 w-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer (fixed) */}
          <div className="px-5 py-4 border-t border-gray-100 flex justify-end bg-white">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 active:scale-[0.98] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
