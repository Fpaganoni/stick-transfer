"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateReport } from "@/hooks/useReport";
import { toast } from "sonner";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  /** A club account is reported on the CLUB axis, never as a USER. */
  targetType: "USER" | "CLUB";
}

const REPORT_REASONS = [
  "SPAM",
  "HARASSMENT",
  "INAPPROPRIATE_CONTENT",
  "FAKE_PROFILE",
  "OTHER",
] as const;

const REASON_LABELS: Record<(typeof REPORT_REASONS)[number], string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  INAPPROPRIATE_CONTENT: "Inappropriate Content",
  FAKE_PROFILE: "Fake Profile",
  OTHER: "Other",
};

export function ReportModal({
  isOpen,
  onClose,
  targetId,
  targetType,
}: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const createReport = useCreateReport();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLSelectElement>(null);

  const handleSubmit = () => {
    if (!reason) return;
    createReport.mutate(
      { targetType, targetId, reason, description: description || undefined },
      {
        onSuccess: () => {
          toast.success("Report submitted successfully");
          setReason("");
          setDescription("");
          onClose();
        },
        onError: () => toast.error("Failed to submit report"),
      },
    );
  };

  const handleClose = useCallback(() => {
    setReason("");
    setDescription("");
    onClose();
  }, [onClose]);

  const onEscape = useEffectEvent(() => {
    handleClose();
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus goes to the first field when it opens and back to what opened it when it closes
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    reasonRef.current?.focus();
    return () => opener?.focus();
  }, [isOpen]);

  // Tab and Shift+Tab wrap inside the dialog instead of reaching the page behind it
  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      "button:not(:disabled), select, textarea, input, a[href]",
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={trapFocus}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md bg-background border border-border rounded-2xl shadow-xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 id={titleId} className="text-base font-semibold text-foreground">
                Report User
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-border/30 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="report-reason" className="text-sm font-medium text-foreground">
                  Reason
                </label>
                <select
                  ref={reasonRef}
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-(--input-button-height) px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                >
                  <option value="">Select a reason</option>
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {REASON_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="report-description" className="text-sm font-medium text-foreground">
                  Description{" "}
                  <span className="text-foreground-muted font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="report-description"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value.slice(0, 500))
                  }
                  placeholder="Tell us more about this issue..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                />
                <p className="text-xs text-foreground-muted text-right">
                  {description.length}/500
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
              <button
                onClick={handleClose}
                className="h-(--input-button-height) px-4 rounded-lg border border-border text-sm text-foreground hover:bg-border/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || createReport.isPending}
                className="h-(--input-button-height) px-4 rounded-lg bg-primary text-white-black text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {createReport.isPending ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
