"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Upload, Trash2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface CvUploadSectionProps {
  t: (key: string, opts?: { fallback?: string }) => string;
  cvUrl?: string;
  cvFile: File | null;
  cvDeleted: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
  onDeleteExisting: () => void;
}

export function CvUploadSection({
  t,
  cvUrl,
  cvFile,
  cvDeleted,
  inputRef,
  onFileChange,
  onDeleteExisting,
}: CvUploadSectionProps) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>{t("cv.label", { fallback: "Curriculum Vitae" })}</CardTitle>
        <CardDescription>
          {t("cv.upload", { fallback: "Upload your CV in PDF format" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 border border-input rounded-md p-4 bg-muted/20">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (f.size > 5 * 1024 * 1024) {
                  toast.error("File too large. Maximum 5MB.");
                  return;
                }
                if (f.type !== "application/pdf") {
                  toast.error("Invalid file format. Please upload a PDF.");
                  return;
                }
                onFileChange(f);
              }
              e.target.value = "";
            }}
          />
          {cvFile ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{cvFile.name}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="border border-error py-2.5 px-3 rounded-md hover:bg-error/10 transition-colors"
                onClick={() => onFileChange(null)}
              >
                <Trash2 className="w-4 h-4 text-error " />
              </motion.button>
            </div>
          ) : cvUrl && !cvDeleted ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline text-primary truncate max-w-[200px] md:max-w-xs block"
                >
                  {t("cv.download", { fallback: "Download existing CV" })}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t("cv.change", { fallback: "Change" })}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onDeleteExisting}
                  aria-label={t("editForm.removeCv")}
                >
                  <Trash2 className="w-4 h-4 text-error hover:text-error/70 transition-colors" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed py-10"
              onClick={() => inputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-1 text-foreground-muted hover:text-foreground">
                <Upload className="w-6 h-6 mb-1 text-primary" />
                <span className="font-semibold text-primary">
                  {t("cv.upload", { fallback: "Upload CV (PDF)" })}
                </span>
                <span className="text-xs">Max size: 5MB</span>
              </div>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
