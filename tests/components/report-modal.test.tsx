import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportModal } from "@/components/profile/report-modal";

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("@/hooks/useReport", () => ({
  useCreateReport: () => ({ mutate, isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("ReportModal", () => {
  beforeEach(() => mutate.mockReset());

  it.each(["USER", "CLUB"] as const)(
    "reports the target with the %s axis it was opened for",
    async (targetType) => {
      const user = userEvent.setup();
      render(<ReportModal isOpen onClose={vi.fn()} targetId="target-1" targetType={targetType} />);

      await user.selectOptions(screen.getByLabelText("Reason"), "SPAM");
      await user.click(screen.getByRole("button", { name: "Submit Report" }));

      expect(mutate).toHaveBeenCalledWith(
        { targetType, targetId: "target-1", reason: "SPAM", description: undefined },
        expect.any(Object),
      );
    },
  );

  it("does not submit without a reason", async () => {
    const user = userEvent.setup();
    render(<ReportModal isOpen onClose={vi.fn()} targetId="club-1" targetType="CLUB" />);

    await user.click(screen.getByRole("button", { name: "Submit Report" }));

    expect(mutate).not.toHaveBeenCalled();
  });
});
