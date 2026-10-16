/**
 * What: Tests for FileUploader used inside a form.
 * Why: The club edit form puts the crest and cover uploaders inside its <form>.
 *      A <button> without type="button" submits that form, so a real click on
 *      the dropzone or on "remove" would save the club by accident. The E2E
 *      suite picks files with setInputFiles and never clicks them.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUploader } from "@/components/clubs/file-uploader";

const LABELS = {
  dragOrClick: "dragOrClick",
  supportedFormats: "supportedFormats",
  fileTooLarge: "fileTooLarge",
  invalidFileType: "invalidFileType",
  uploading: "uploading",
  uploadFailed: "uploadFailed",
  removeFile: "removeFile",
};

function renderInsideForm(upload = vi.fn().mockResolvedValue("https://img/crest.png")) {
  const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
  const onFileSelect = vi.fn();
  const view = render(
    <form onSubmit={onSubmit}>
      <FileUploader
        upload={upload}
        onFileSelect={onFileSelect}
        accept=".png"
        validTypes={["image/png"]}
        labels={LABELS}
      />
    </form>,
  );
  const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
  return { onSubmit, onFileSelect, upload, input };
}

describe("FileUploader inside a form", () => {
  it("opens the file picker without submitting the form", async () => {
    const user = userEvent.setup();
    const { onSubmit, input } = renderInsideForm();
    const pick = vi.spyOn(input, "click");

    await user.click(screen.getByRole("button", { name: /dragOrClick/ }));

    expect(pick).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("is a plain button, not a submit button", () => {
    renderInsideForm();

    expect(screen.getByRole("button", { name: /dragOrClick/ })).toHaveAttribute("type", "button");
  });

  it("removes the chosen file without submitting the form", async () => {
    const user = userEvent.setup();
    const { onSubmit, onFileSelect, input } = renderInsideForm();

    await user.upload(input, new File(["x"], "crest.png", { type: "image/png" }));
    await waitFor(() => expect(onFileSelect).toHaveBeenCalledWith("https://img/crest.png"));
    const remove = await screen.findByRole("button", { name: "removeFile" });
    expect(remove).toHaveAttribute("type", "button");
    await user.click(remove);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /dragOrClick/ })).toBeInTheDocument();
  });

  it("uploads the chosen file and reports its url", async () => {
    const user = userEvent.setup();
    const { onSubmit, onFileSelect, upload, input } = renderInsideForm();
    const file = new File(["x"], "crest.png", { type: "image/png" });

    await user.upload(input, file);

    await waitFor(() => expect(onFileSelect).toHaveBeenCalledWith("https://img/crest.png"));
    expect(upload).toHaveBeenCalledWith(file);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("refuses a file of the wrong type", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { onFileSelect, upload, input } = renderInsideForm();

    await user.upload(input, new File(["x"], "doc.pdf", { type: "application/pdf" }));

    expect(await screen.findByText("invalidFileType")).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
    expect(onFileSelect).not.toHaveBeenCalled();
  });
});
