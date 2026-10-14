import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DOCUMENT_ALLOWED_FORMATS,
  IMAGE_ALLOWED_FORMATS,
  uploadSignedFile,
} from "@/lib/cloudinary-upload";
import type { UploadSignature } from "@/types/models/upload";

const signature: UploadSignature = {
  cloudName: "demo",
  apiKey: "123456",
  timestamp: 1_790_000_000,
  signature: "abc123signature",
  folder: "stick-transfer/users/u1",
  publicId: "stick-transfer/users/u1/avatar",
  uploadUrl: "https://api.cloudinary.com/v1_1/demo/image/upload",
};

const pngFile = () => new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" });

describe("uploadSignedFile", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ secure_url: "https://res.cloudinary.com/demo/image/upload/v1/x.png" }), {
        status: 200,
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("posts exactly the signed parameters, and nothing else, to the signed url", async () => {
    await uploadSignedFile(pngFile(), signature, IMAGE_ALLOWED_FORMATS);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(signature.uploadUrl);
    expect(init.method).toBe("POST");

    const fields = Object.fromEntries((init.body as FormData).entries());
    expect(Object.keys(fields).sort()).toEqual(
      [
        "allowed_formats",
        "api_key",
        "file",
        "invalidate",
        "overwrite",
        "public_id",
        "signature",
        "timestamp",
      ].sort(),
    );
    expect(fields).toMatchObject({
      api_key: "123456",
      timestamp: "1790000000",
      signature: "abc123signature",
      public_id: "stick-transfer/users/u1/avatar",
      overwrite: "true",
      invalidate: "true",
      allowed_formats: "jpg,png,webp",
    });
  });

  it("never sends folder, which is informational and not part of the signature", async () => {
    await uploadSignedFile(pngFile(), signature, IMAGE_ALLOWED_FORMATS);

    expect((fetchMock.mock.calls[0][1].body as FormData).has("folder")).toBe(false);
  });

  it("sends the document formats the backend signed", async () => {
    await uploadSignedFile(pngFile(), signature, DOCUMENT_ALLOWED_FORMATS);

    expect((fetchMock.mock.calls[0][1].body as FormData).get("allowed_formats")).toBe(
      "pdf,doc,docx",
    );
  });

  it("returns the https secure_url Cloudinary answers with", async () => {
    await expect(uploadSignedFile(pngFile(), signature, IMAGE_ALLOWED_FORMATS)).resolves.toBe(
      "https://res.cloudinary.com/demo/image/upload/v1/x.png",
    );
  });

  it.each([
    "https://evil.example.com/upload",
    "http://api.cloudinary.com/v1_1/demo/image/upload",
    "https://api.cloudinary.com.evil.com/v1_1/demo/image/upload",
  ])("refuses to send the file to %s", async (uploadUrl) => {
    await expect(
      uploadSignedFile(pngFile(), { ...signature, uploadUrl }, IMAGE_ALLOWED_FORMATS),
    ).rejects.toThrow("Unexpected upload destination");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails when Cloudinary rejects the upload", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Invalid Signature" } }), { status: 401 }),
    );

    await expect(uploadSignedFile(pngFile(), signature, IMAGE_ALLOWED_FORMATS)).rejects.toThrow(
      "Upload failed",
    );
  });

  it.each([{}, { secure_url: 42 }, { secure_url: "http://res.cloudinary.com/x.png" }])(
    "fails when the answer has no usable https secure_url (%j)",
    async (body) => {
      fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));

      await expect(
        uploadSignedFile(pngFile(), signature, IMAGE_ALLOWED_FORMATS),
      ).rejects.toThrow("Upload failed");
    },
  );
});
