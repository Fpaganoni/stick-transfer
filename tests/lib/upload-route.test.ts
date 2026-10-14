import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "@/app/api/upload/route";

// jsdom's Blob has no arrayBuffer(); the Node runtime that serves the route does.
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function (this: Blob) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MB = 1024 * 1024;

function uploadRequest(
  file: File | null,
  { cookie = "st-auth=1", headers = {} }: { cookie?: string; headers?: Record<string, string> } = {},
) {
  const body = new FormData();
  if (file) body.append("file", file);
  const cookies = new Map(cookie ? [[cookie.split("=")[0], { value: cookie.split("=")[1] }]] : []);
  const lowerHeaders = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  // The route only touches cookies, headers and formData(); jsdom's File/FormData
  // cannot round-trip through a real multipart Request, so the body is handed over directly.
  return {
    cookies: { get: (name: string) => cookies.get(name) },
    headers: { get: (name: string) => lowerHeaders.get(name.toLowerCase()) ?? null },
    formData: async () => body,
  } as unknown as NextRequest;
}

const fileOf = (bytes: number[], name: string, type: string, padTo = 0) =>
  new File([new Uint8Array(Math.max(padTo, bytes.length)).map((_, i) => bytes[i] ?? 0)], name, { type });

describe("POST /api/upload", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "demo");
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_PRESET_POSTS", "posts");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ secure_url: "https://res.cloudinary.com/demo/x.png" }), { status: 200 }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("requires the st-auth cookie", async () => {
    const res = await POST(uploadRequest(fileOf(PNG_HEADER, "a.png", "image/png"), { cookie: "" }));

    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uploads a real image and returns its url", async () => {
    const res = await POST(uploadRequest(fileOf(PNG_HEADER, "a.png", "image/png")));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://res.cloudinary.com/demo/x.png" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an HTML page that declares an image content type", async () => {
    const html = Array.from(Buffer.from("<html><script>alert(1)</script>"));
    const res = await POST(uploadRequest(fileOf(html, "evil.png", "image/png")));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a file larger than 10 MB", async () => {
    const res = await POST(uploadRequest(fileOf(PNG_HEADER, "big.png", "image/png", 10 * MB + 1)));

    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an oversized body from its Content-Length before reading it", async () => {
    const res = await POST(
      uploadRequest(fileOf(PNG_HEADER, "a.png", "image/png"), {
        headers: { "content-length": String(50 * MB) },
      }),
    );

    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a request without a file", async () => {
    const res = await POST(uploadRequest(null));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
