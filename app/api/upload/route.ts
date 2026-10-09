import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: NextRequest) {
  try {
    const authCookie = request.cookies.get("st-auth");
    if (!authCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
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
