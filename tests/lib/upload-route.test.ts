import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "@/app/api/upload/route";

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MB = 1024 * 1024;
const BOUNDARY = "----upload-test-boundary";
const encoder = new TextEncoder();

function multipartBody(file: { bytes: Uint8Array; name: string; type: string } | null): Uint8Array {
  const head = file
    ? `--${BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`
    : `--${BOUNDARY}\r\nContent-Disposition: form-data; name="note"\r\n\r\nhello`;
  const tail = `\r\n--${BOUNDARY}--\r\n`;
  const parts = [encoder.encode(head), file?.bytes ?? new Uint8Array(0), encoder.encode(tail)];
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

const streamOf = (chunks: Uint8Array[], onPull?: () => void) => {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      onPull?.();
      if (index < chunks.length) controller.enqueue(chunks[index++]);
      else controller.close();
    },
  });
};

interface RequestOptions {
  cookie?: string;
  headers?: Record<string, string>;
  contentType?: string;
}

function uploadRequest(
  body: ReadableStream<Uint8Array> | null,
  { cookie = "st-auth=1", headers = {}, contentType = `multipart/form-data; boundary=${BOUNDARY}` }: RequestOptions = {},
) {
  const cookies = new Map(cookie ? [[cookie.split("=")[0], { value: cookie.split("=")[1] }]] : []);
  const allHeaders = new Map(
    Object.entries({ "content-type": contentType, ...headers }).map(([k, v]) => [k.toLowerCase(), v]),
  );
  // The route only touches cookies, headers and the body stream.
  return {
    cookies: { get: (name: string) => cookies.get(name) },
    headers: { get: (name: string) => allHeaders.get(name.toLowerCase()) ?? null },
    body,
  } as unknown as NextRequest;
}

const pngFile = (padTo = 0) => {
  const bytes = new Uint8Array(Math.max(padTo, PNG_HEADER.length));
  bytes.set(PNG_HEADER);
  return { bytes, name: "a.png", type: "image/png" };
};

const upload = (file: Parameters<typeof multipartBody>[0], options?: RequestOptions) =>
  POST(uploadRequest(streamOf([multipartBody(file)]), options));

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
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requires the st-auth cookie", async () => {
    const res = await upload(pngFile(), { cookie: "" });

    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a body that is not multipart", async () => {
    const res = await upload(pngFile(), { contentType: "application/json" });

    expect(res.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uploads a real image and returns its url", async () => {
    const res = await upload(pngFile());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://res.cloudinary.com/demo/x.png" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an HTML page that declares an image content type", async () => {
    const html = encoder.encode("<html><script>alert(1)</script>");
    const res = await upload({ bytes: html, name: "evil.png", type: "image/png" });

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a file larger than 10 MB", async () => {
    const res = await upload(pngFile(10 * MB + 1));

    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an oversized body from its declared Content-Length before reading it", async () => {
    let pulls = 0;
    const res = await POST(
      uploadRequest(streamOf([multipartBody(pngFile())], () => (pulls += 1)), {
        headers: { "content-length": String(50 * MB) },
      }),
    );

    expect(res.status).toBe(413);
    expect(pulls).toBeLessThanOrEqual(1); // ReadableStream prefetches one chunk on creation; the route reads none
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caps a chunked body that has no Content-Length, without reading all of it", async () => {
    let pulls = 0;
    const chunks = Array.from({ length: 200 }, () => new Uint8Array(MB)); // 200 MB
    const res = await POST(uploadRequest(streamOf(chunks, () => (pulls += 1))));

    expect(res.status).toBe(413);
    expect(pulls).toBeLessThan(20);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caps a body whose Content-Length lies about its size", async () => {
    let pulls = 0;
    const chunks = Array.from({ length: 200 }, () => new Uint8Array(MB));
    const res = await POST(
      uploadRequest(streamOf(chunks, () => (pulls += 1)), { headers: { "content-length": "100" } }),
    );

    expect(res.status).toBe(413);
    expect(pulls).toBeLessThan(20);
  });

  it("rejects a request without a file", async () => {
    const res = await upload(null);

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hides Cloudinary details when the upstream upload fails", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Invalid api_key abc123" } }), { status: 401 }),
    );

    const res = await upload(pngFile());

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Upload failed" });
  });

  it("does not reveal which configuration is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_PRESET_POSTS", "");

    const res = await upload(pngFile());

    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toMatch(/cloudinary|preset|env/i);
  });
});
