/** Content types the upload endpoint accepts, detected from the file's own bytes. */
export type DetectedFileType =
  | "application/pdf"
  | "application/msword"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "image/jpeg"
  | "image/png"
  | "image/webp";

/** Longest signature checked below (WebP needs bytes 0-3 and 8-11). */
export const SIGNATURE_BYTES = 12;

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value);

/**
 * Identifies a file by its magic bytes, so a client cannot upload an
 * executable or HTML page just by declaring `Content-Type: image/png`.
 * Returns null when the header matches none of the supported types.
 *
 * A DOCX is a ZIP: the signature only proves "zip", which is accepted because
 * Cloudinary stores it as an opaque raw file and never renders it.
 */
export function detectFileType(bytes: Uint8Array): DetectedFileType | null {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "application/msword";
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return null;
}
