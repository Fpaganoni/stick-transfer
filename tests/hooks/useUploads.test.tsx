import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDocumentUpload, useImageUpload } from "@/hooks/useUploads";

const { mockRequest, mockUploadSignedFile } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
  mockUploadSignedFile: vi.fn(),
}));

vi.mock("@/lib/graphql-client", () => ({
  graphqlClient: { request: mockRequest },
}));

vi.mock("@/lib/cloudinary-upload", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cloudinary-upload")>(
    "@/lib/cloudinary-upload",
  );
  return { ...actual, uploadSignedFile: mockUploadSignedFile };
});

const signature = {
  cloudName: "demo",
  apiKey: "k",
  timestamp: 1,
  signature: "s",
  folder: "f",
  publicId: "p",
  uploadUrl: "https://api.cloudinary.com/v1_1/demo/image/upload",
};

const file = new File(["x"], "a.png", { type: "image/png" });

describe("useImageUpload", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockUploadSignedFile.mockReset();
    mockUploadSignedFile.mockResolvedValue("https://res.cloudinary.com/demo/image/upload/v1/a.png");
  });

  it("asks the backend to sign the target, then uploads with the image formats", async () => {
    mockRequest.mockResolvedValue({ createImageUploadSignature: signature });
    const { result } = renderHook(() => useImageUpload("USER_AVATAR"));

    await expect(result.current(file)).resolves.toBe(
      "https://res.cloudinary.com/demo/image/upload/v1/a.png",
    );

    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), { target: "USER_AVATAR" });
    expect(mockUploadSignedFile).toHaveBeenCalledWith(file, signature, "jpg,png,webp");
  });

  it("includes clubId only when one is given", async () => {
    mockRequest.mockResolvedValue({ createImageUploadSignature: signature });
    const { result } = renderHook(() => useImageUpload("CLUB_LOGO", "club-1"));

    await result.current(file);

    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), {
      target: "CLUB_LOGO",
      clubId: "club-1",
    });
  });

  it("does not upload when the backend refuses to sign", async () => {
    mockRequest.mockRejectedValue(new Error("You are not the admin of this club"));
    const { result } = renderHook(() => useImageUpload("CLUB_LOGO"));

    await expect(result.current(file)).rejects.toThrow("not the admin");
    expect(mockUploadSignedFile).not.toHaveBeenCalled();
  });
});

describe("useDocumentUpload", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockUploadSignedFile.mockReset();
    mockUploadSignedFile.mockResolvedValue("https://res.cloudinary.com/demo/raw/upload/v1/doc.pdf");
  });

  it("signs the club verification document and uploads with the document formats", async () => {
    mockRequest.mockResolvedValue({ createDocumentUploadSignature: signature });
    const { result } = renderHook(() => useDocumentUpload("CLUB_VERIFICATION", "club-1"));

    await expect(result.current(file)).resolves.toBe(
      "https://res.cloudinary.com/demo/raw/upload/v1/doc.pdf",
    );

    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), {
      target: "CLUB_VERIFICATION",
      clubId: "club-1",
    });
    expect(mockUploadSignedFile).toHaveBeenCalledWith(file, signature, "pdf,doc,docx");
  });
});
