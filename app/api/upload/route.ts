import { NextRequest, NextResponse } from "next/server";
import { detectFileType, SIGNATURE_BYTES } from "@/lib/file-signature";
import { PayloadTooLargeError, readBodyWithLimit } from "@/lib/read-limited-body";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];

/** Matches the client-side limit in components/clubs/file-uploader.tsx. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Multipart framing around the file; the whole body may not exceed file + framing. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const MAX_BODY_BYTES = MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES;

/** Anything with a name and bytes; instanceof File is avoided because the File class differs across runtimes. */
function isUploadedFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).arrayBuffer === "function" &&
    typeof (value as File).size === "number" &&
    typeof (value as File).slice === "function"
  );
}

// INTERIM: the "st-auth" cookie is a UI hint (see api/auth/session) that any
// visitor can obtain, so this check does not prove a real session and this
// endpoint writes to an unsigned Cloudinary preset. Replace it with
// backend-signed uploads (createImageUploadSignature, extended to documents);
// until then the limits below only bound abuse (size and real file type).
// Error bodies are generic on purpose: details go to the server log only.
export async function POST(request: NextRequest) {
  try {
    const authCookie = request.cookies.get("st-auth");
    if (!authCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json({ error: "Unsupported request" }, { status: 415 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const type = request.headers.get("x-content-type") || "post";
    const preset =
      type === "story"
        ? process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_STORIES
        : process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_POSTS;

    if (!cloudName || !preset) {
      console.error("Upload is not configured: Cloudinary cloud name or preset is missing");
      return NextResponse.json({ error: "Upload unavailable" }, { status: 500 });
    }

    // Stream the body with a hard cap: request.formData() would buffer all of it
    // before any size check, and Content-Length can be absent (chunked) or wrong.
    let body: Uint8Array<ArrayBuffer>;
    try {
      body = await readBodyWithLimit(request.body, MAX_BODY_BYTES);
    } catch (error) {
      if (error instanceof PayloadTooLargeError) {
        return NextResponse.json({ error: "File too large" }, { status: 413 });
      }
      throw error;
    }

    const formData = await new Response(body, {
      headers: { "content-type": contentType },
    }).formData();
    const file = formData.get("file");

    if (!isUploadedFile(file)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    // Trust the file's own bytes, not the Content-Type the client declared.
    const header = new Uint8Array(await file.slice(0, SIGNATURE_BYTES).arrayBuffer());
    const detectedType = detectFileType(header);
    if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 },
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("upload_preset", preset);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

    const response = await fetch(url, {
      method: "POST",
      body: uploadFormData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Cloudinary error:", {
        status: response.status,
        error: responseData,
      });
      return NextResponse.json({ error: "Upload failed" }, { status: 502 });
    }

    return NextResponse.json({
      url: responseData.secure_url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
