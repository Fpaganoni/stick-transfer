import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
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

  describe("accessibility", () => {
    function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>open report</button>
          <ReportModal
            isOpen={open}
            onClose={() => {
              onClose();
              setOpen(false);
            }}
            targetId="t-1"
            targetType="USER"
          />
        </>
      );
    }

    it("is a modal dialog named by its title", () => {
      render(<ReportModal isOpen onClose={vi.fn()} targetId="t-1" targetType="USER" />);

      const dialog = screen.getByRole("dialog", { name: "Report User" });
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("moves the focus to the first field when it opens", () => {
      render(<ReportModal isOpen onClose={vi.fn()} targetId="t-1" targetType="USER" />);

      expect(screen.getByLabelText("Reason")).toHaveFocus();
    });

    it("keeps the focus inside while open: Tab and Shift+Tab wrap around", async () => {
      const user = userEvent.setup();
      render(<ReportModal isOpen onClose={vi.fn()} targetId="t-1" targetType="USER" />);
      const closeButton = screen.getByRole("button", { name: "Close" });
      const cancel = screen.getByRole("button", { name: "Cancel" });

      cancel.focus();
      await user.tab();
      expect(closeButton).toHaveFocus();

      await user.tab({ shift: true });
      expect(cancel).toHaveFocus();
    });

    it("has a single Close button: the backdrop is not a second one in the tab order", () => {
      render(<ReportModal isOpen onClose={vi.fn()} targetId="t-1" targetType="USER" />);

      expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(1);
    });

    it("closes with Escape", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ReportModal isOpen onClose={onClose} targetId="t-1" targetType="USER" />);

      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("gives the focus back to what opened it", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      const trigger = screen.getByRole("button", { name: "open report" });

      await user.click(trigger);
      expect(screen.getByLabelText("Reason")).toHaveFocus();
      await user.keyboard("{Escape}");

      await waitFor(() => expect(trigger).toHaveFocus());
    });
  });

  it("does not submit without a reason", async () => {
    const user = userEvent.setup();
    render(<ReportModal isOpen onClose={vi.fn()} targetId="club-1" targetType="CLUB" />);

    await user.click(screen.getByRole("button", { name: "Submit Report" }));

    expect(mutate).not.toHaveBeenCalled();
  });
});
