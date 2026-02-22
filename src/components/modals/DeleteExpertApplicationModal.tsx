"use client";

import React from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import type { ExpertApplication } from "./ExpertApplicationsModal";

export default function DeleteExpertApplicationModal({
  open,
  app,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  app: ExpertApplication | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open || !app) return null;

  const label =
    app.displayName ||
    app.email ||
    (app.uid ? `UID: ${app.uid}` : "Unknown applicant");

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!loading) onCancel();
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-black/10 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">
                  Delete application?
                </h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">{label}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-4">
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-3 text-sm">
              This will permanently delete the expert application record (global
              and user mirror). This can’t be undone.
            </div>

            <div className="mt-3 text-xs text-gray-600">
              Only <span className="font-medium">approved</span> or{" "}
              <span className="font-medium">rejected</span> applications can be
              deleted.
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="rounded-lg border border-red-200 text-red-700 bg-red-50 px-4 py-2 text-sm hover:bg-red-100 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
