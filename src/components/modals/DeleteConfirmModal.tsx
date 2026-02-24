"use client";

import { useEffect } from "react";
import { Trash2, X } from "lucide-react";

export type DeleteConfirmModalProps = {
  open: boolean;

  /** Main title */
  title?: string;

  /** Optional body message (supports \n new lines) */
  message?: string;

  /** Extra info line shown in a monospace pill (ex: Scan ID, Post ID) */
  itemIdText?: string;

  /** Extra label shown under the message (ex: Plant name / user email) */
  itemLabelText?: string;

  /** Button texts */
  confirmText?: string;
  cancelText?: string;

  /** Loading state for the confirm button */
  loading?: boolean;

  /** Disable closing while loading (default true) */
  lockWhileLoading?: boolean;

  /** Called when user clicks confirm */
  onConfirm: () => void | Promise<void>;

  /** Called when user closes/cancels */
  onClose: () => void;
};

/**
 * ✅ Reusable DeleteConfirmModal
 * - Escape key closes
 * - Click outside closes
 * - Prevents closing while loading (optional)
 * - No antd needed
 */
export default function DeleteConfirmModal({
  open,
  title = "Delete item?",
  message = "This action cannot be undone.",
  itemIdText,
  itemLabelText,
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  lockWhileLoading = true,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  // Close on ESC
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (lockWhileLoading && loading) return;
        onClose();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, loading, lockWhileLoading]);

  if (!open) return null;

  function safeClose() {
    if (lockWhileLoading && loading) return;
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={safeClose} />

      {/* modal */}
      <div className="relative w-[92vw] max-w-md rounded-2xl bg-white shadow-xl border border-black/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">{title}</div>

            <div className="mt-1 text-xs text-gray-600 whitespace-pre-line">
              {message}
            </div>

            {itemLabelText ? (
              <div className="mt-3 text-xs text-gray-800 line-clamp-2">
                {itemLabelText}
              </div>
            ) : null}

            {itemIdText ? (
              <div className="mt-2 inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-700 font-mono">
                {itemIdText}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={safeClose}
            disabled={lockWhileLoading && loading}
            className="p-2 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={safeClose}
            disabled={lockWhileLoading && loading}
            className="text-xs rounded-lg border border-gray-200 px-3 py-2 bg-white hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="text-xs rounded-lg px-3 py-2 bg-red-600 hover:bg-red-700 text-white border border-red-600 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Trash2 size={14} />
            {loading ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
