import { describe, it, expect } from "vitest";
import {
  FILLED_DELETE_COOLDOWN_DAYS,
  getJobDeletionState,
} from "@/lib/job-deletion-rules";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-15T12:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * DAY_MS).toISOString();
}

describe("getJobDeletionState", () => {
  it("uses a 14 day cooldown, same as the backend", () => {
    expect(FILLED_DELETE_COOLDOWN_DAYS).toBe(14);
  });

  it("allows deleting a job with no unanswered applications", () => {
    expect(
      getJobDeletionState({ status: "OPEN", filledAt: null, unansweredCount: 0, now: NOW }),
    ).toEqual({ canDelete: true });
  });

  it("blocks a job with unanswered applications", () => {
    expect(
      getJobDeletionState({ status: "CLOSED", filledAt: null, unansweredCount: 3, now: NOW }),
    ).toEqual({ canDelete: false, reason: "UNANSWERED_APPLICATIONS" });
  });

  it("blocks a filled job inside the cooldown and reports when it unlocks", () => {
    const state = getJobDeletionState({
      status: "FILLED",
      filledAt: daysAgo(13),
      unansweredCount: 2,
      now: NOW,
    });
    expect(state).toEqual({
      canDelete: false,
      reason: "FILLED_COOLDOWN",
      availableAt: new Date(NOW.getTime() + DAY_MS),
    });
  });

  it("allows a filled job exactly 14 days after filledAt", () => {
    expect(
      getJobDeletionState({ status: "FILLED", filledAt: daysAgo(14), unansweredCount: 4, now: NOW }),
    ).toEqual({ canDelete: true });
  });

  it("allows a filled job inside the cooldown when every application is answered", () => {
    expect(
      getJobDeletionState({ status: "FILLED", filledAt: daysAgo(1), unansweredCount: 0, now: NOW }),
    ).toEqual({ canDelete: true });
  });

  it("treats a filled job without filledAt as plain unanswered applications", () => {
    expect(
      getJobDeletionState({ status: "FILLED", filledAt: null, unansweredCount: 1, now: NOW }),
    ).toEqual({ canDelete: false, reason: "UNANSWERED_APPLICATIONS" });
  });

  it("reads the status case-insensitively", () => {
    expect(
      getJobDeletionState({ status: "filled", filledAt: daysAgo(20), unansweredCount: 5, now: NOW }),
    ).toEqual({ canDelete: true });
  });

  it("ignores an unparseable filledAt instead of unlocking the delete", () => {
    expect(
      getJobDeletionState({ status: "FILLED", filledAt: "not-a-date", unansweredCount: 1, now: NOW }),
    ).toEqual({ canDelete: false, reason: "UNANSWERED_APPLICATIONS" });
  });
});
