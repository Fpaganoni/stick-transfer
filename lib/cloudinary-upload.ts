import type { UploadSignature } from "@/types/models/upload";

/** Signed by the backend as `allowed_formats`; the browser must send the same value. */
export const IMAGE_ALLOWED_FORMATS = "jpg,png,webp";
export const DOCUMENT_ALLOWED_FORMATS = "pdf,doc,docx";

const CLOUDINARY_UPLOAD_ORIGIN = "https://api.cloudinary.com/";

/**
 * Uploads one file straight to Cloudinary with a backend-issued signature and
 * returns its `secure_url`.
 *
 * Cloudinary rejects the upload ("Invalid Signature") unless the form carries
 * EXACTLY the signed parameters: timestamp, public_id, overwrite, invalidate and
 * allowed_formats (plus file, api_key and signature). Do not add fields such as
 * `folder`.
 */
export async function uploadSignedFile(
  file: File,
  signature: UploadSignature,
  allowedFormats: string,
): Promise<string> {
  if (!signature.uploadUrl.startsWith(CLOUDINARY_UPLOAD_ORIGIN)) {
    throw new Error("Unexpected upload destination");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signature.apiKey);
  form.append("timestamp", String(signature.timestamp));
  form.append("signature", signature.signature);
  form.append("public_id", signature.publicId);
  form.append("overwrite", "true");
  form.append("invalidate", "true");
  form.append("allowed_formats", allowedFormats);

  const response = await fetch(signature.uploadUrl, { method: "POST", body: form });
  if (!response.ok) throw new Error("Upload failed");

  const data: { secure_url?: unknown } = await response.json();
  if (typeof data.secure_url !== "string" || !data.secure_url.startsWith("https://")) {
    throw new Error("Upload failed");
  }
  return data.secure_url;
}
