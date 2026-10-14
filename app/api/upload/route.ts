import { NextRequest, NextResponse } from "next/server";
import { detectFileType, SIGNATURE_BYTES } from "@/lib/file-signature";

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

/** Multipart framing around the file; a larger body is rejected before it is buffered. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

// INTERIM: the "st-auth" cookie is a UI hint (see api/auth/session) that any
// visitor can obtain, so this check does not prove a real session and this
// endpoint writes to an unsigned Cloudinary preset. Replace it with
// backend-signed uploads (createImageUploadSignature, extended to documents);
// until then the limits below only bound abuse (size and real file type).
export async function POST(request: NextRequest) {
  try {
    const authCookie = request.cookies.get("st-auth");
    if (!authCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const declaredLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES
    ) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const type = request.headers.get("x-content-type") || "post";
    const preset =
      type === "story"
        ? process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_STORIES
        : process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_POSTS;

    if (!cloudName || !preset) {
      console.error("Missing Cloudinary env vars:", {
        cloudName: !!cloudName,
        uploadPreset: !!preset,
      });
      return NextResponse.json(
        { error: "Server misconfigured: Missing Cloudinary credentials" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
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
      return NextResponse.json(
        { error: responseData.error?.message || "Upload failed" },
        { status: response.status },
      );
    }

    return NextResponse.json({
      url: responseData.secure_url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
