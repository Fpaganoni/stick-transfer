import { gql } from "graphql-request";

// ============================================
// SIGNED UPLOAD MUTATIONS
// ============================================
// The backend signs; the browser then POSTs the file straight to Cloudinary
// (see lib/cloudinary-upload.ts). The api secret never reaches the front.

const SIGNATURE_FIELDS = `
      cloudName
      apiKey
      timestamp
      signature
      folder
      publicId
      uploadUrl`;

export const CREATE_IMAGE_UPLOAD_SIGNATURE = gql`
  mutation CreateImageUploadSignature($target: ImageUploadTarget!, $clubId: ID) {
    createImageUploadSignature(target: $target, clubId: $clubId) {${SIGNATURE_FIELDS}
    }
  }
`;

export const CREATE_DOCUMENT_UPLOAD_SIGNATURE = gql`
  mutation CreateDocumentUploadSignature($target: DocumentUploadTarget!, $clubId: ID) {
    createDocumentUploadSignature(target: $target, clubId: $clubId) {${SIGNATURE_FIELDS}
    }
  }
`;
