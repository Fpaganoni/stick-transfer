import { useCallback } from "react";
import { graphqlClient } from "@/lib/graphql-client";
import {
  CREATE_DOCUMENT_UPLOAD_SIGNATURE,
  CREATE_IMAGE_UPLOAD_SIGNATURE,
} from "@/graphql/upload/mutations";
import {
  DOCUMENT_ALLOWED_FORMATS,
  IMAGE_ALLOWED_FORMATS,
  uploadSignedFile,
} from "@/lib/cloudinary-upload";
import type {
  CreateDocumentUploadSignatureResponse,
  CreateImageUploadSignatureResponse,
  DocumentUploadTarget,
  ImageUploadTarget,
} from "@/types/models/upload";

/** A function that uploads one file and resolves with the stored url. */
export type FileUpload = (file: File) => Promise<string>;

/**
 * Profile image upload: asks the backend for a signature scoped to the caller's
 * own folder, then sends the file to Cloudinary. The url it resolves with is what
 * updateUser / updateClub accept. `clubId` is only for a super admin acting on a club.
 */
export function useImageUpload(target: ImageUploadTarget, clubId?: string): FileUpload {
  return useCallback(
    async (file) => {
      const { createImageUploadSignature } =
        await graphqlClient.request<CreateImageUploadSignatureResponse>(
          CREATE_IMAGE_UPLOAD_SIGNATURE,
          { target, ...(clubId && { clubId }) },
        );
      return uploadSignedFile(file, createImageUploadSignature, IMAGE_ALLOWED_FORMATS);
    },
    [target, clubId],
  );
}

/** Document (PDF/DOC/DOCX) upload, e.g. a club's verification document. */
export function useDocumentUpload(
  target: DocumentUploadTarget,
  clubId?: string,
): FileUpload {
  return useCallback(
    async (file) => {
      const { createDocumentUploadSignature } =
        await graphqlClient.request<CreateDocumentUploadSignatureResponse>(
          CREATE_DOCUMENT_UPLOAD_SIGNATURE,
          { target, ...(clubId && { clubId }) },
        );
      return uploadSignedFile(file, createDocumentUploadSignature, DOCUMENT_ALLOWED_FORMATS);
    },
    [target, clubId],
  );
}
