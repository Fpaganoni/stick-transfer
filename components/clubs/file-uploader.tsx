"use client";

import { useRef, useState } from "react";
import { Upload, X, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface FileUploaderProps {
  onFileSelect: (url: string) => void;
  isLoading?: boolean;
  accept?: string;
}

export function FileUploader({
  onFileSelect,
  isLoading,
  accept = ".pdf,.doc,.docx",
}: FileUploaderProps) {
  const t = useTranslations("clubs.verification");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(t("fileTooLarge"));
      return;
    }

    // Validar tipo
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      setError(t("invalidFileType"));
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      onFileSelect(data.url);
      setIsUploading(false);
    } catch {
      setError(t("uploadFailed"));
      setUploadedFile(null);
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {!uploadedFile ? (
        <button
          onClick={handleClick}
          disabled={isLoading || isUploading}
          className="w-full border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p className="text-sm text-foreground/70">
            {isUploading ? t("uploading") : t("dragOrClick")}
          </p>
          <p className="text-xs text-foreground/50 mt-1">
            {t("supportedFormats")}
          </p>
        </button>
      ) : (
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-5 h-5 text-primary" />
            )}
            <span className="text-sm text-foreground">{uploadedFile.name}</span>
          </div>
          {!isUploading && (
            <button
              onClick={handleRemove}
              disabled={isLoading}
              className="text-foreground/50 hover:text-foreground transition disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={isLoading || isUploading}
      />
    </div>
  );
}
