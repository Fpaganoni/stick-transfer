/** Where a profile image lands in Cloudinary (backend enum ImageUploadTarget). */
export type ImageUploadTarget =
  | "USER_AVATAR"
  | "USER_COVER"
  | "CLUB_LOGO"
  | "CLUB_COVER";

/** Backend enum DocumentUploadTarget. */
export type DocumentUploadTarget = "CLUB_VERIFICATION";

/** What the backend returns to sign one direct browser -> Cloudinary upload. */
export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  uploadUrl: string;
}

export interface CreateImageUploadSignatureResponse {
  createImageUploadSignature: UploadSignature;
}

export interface CreateDocumentUploadSignatureResponse {
  createDocumentUploadSignature: UploadSignature;
}
