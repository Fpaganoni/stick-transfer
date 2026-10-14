import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CvUploadSection } from "@/components/profile/edit/cv-upload-section";

const t = (key: string, opts?: { fallback?: string }) => opts?.fallback ?? key;

const renderSection = (cvUrl: string) =>
  render(
    <CvUploadSection
      t={t}
      cvUrl={cvUrl}
      cvFile={null}
      cvDeleted={false}
      inputRef={{ current: null }}
      onFileChange={vi.fn()}
      onDeleteExisting={vi.fn()}
    />,
  );

describe("CvUploadSection - existing CV link", () => {
  it("links a normal https CV", () => {
    renderSection("https://res.cloudinary.com/demo/raw/upload/v1/cv.pdf");

    expect(screen.getByRole("link", { name: /Download existing CV/ })).toHaveAttribute(
      "href",
      "https://res.cloudinary.com/demo/raw/upload/v1/cv.pdf",
    );
  });

  it("never renders a javascript: value that reached the database as a clickable link", () => {
    renderSection("javascript:alert(document.cookie)");

    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
  });
});
