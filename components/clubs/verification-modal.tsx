"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { FileUploader } from "./file-uploader";
import { toast } from "@/hooks/ui/use-toast";
import { useRequestClubVerification } from "@/hooks/useClubMutations";

interface VerificationModalProps {
  clubId: string;
  onClose: () => void;
}

export function VerificationModal({ clubId, onClose }: VerificationModalProps) {
  const t = useTranslations("clubs.verification");
  const [documentUrl, setDocumentUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: requestVerification, isPending } =
    useRequestClubVerification();

  const handleSubmit = async () => {
    if (!documentUrl) {
      toast({
        title: t("error"),
        description: t("fileRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    requestVerification(
      { clubId, documentUrl },
      {
        onSuccess: () => {
          toast({
            title: t("success"),
            description: t("verificationRequested"),
          });
          onClose();
        },
        onError: (error) => {
          const errorMsg = error.message || "Unknown error";

          let userMessage = t("genericError");
          if (errorMsg.includes("already verified")) {
            userMessage = t("alreadyVerified");
          } else if (errorMsg.includes("already pending")) {
            userMessage = t("alreadyPending");
          } else if (errorMsg.includes("not found")) {
            userMessage = t("clubNotFound");
          }

          toast({
            title: t("error"),
            description: userMessage,
            variant: "destructive",
          });
          setIsSubmitting(false);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {t("verifyClub")}
          </h2>
          <button
            onClick={onClose}
            disabled={isPending || isSubmitting}
            aria-label={t("close")}
            className="text-foreground/50 hover:text-foreground transition disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-foreground/70">{t("description")}</p>

          <div>
            <label htmlFor="verification-document" className="block text-sm font-medium text-foreground mb-3">
              {t("uploadDocument")}
            </label>
            <FileUploader
              id="verification-document"
              onFileSelect={setDocumentUrl}
              isLoading={isPending || isSubmitting}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isPending || isSubmitting}
              className="flex-1 px-4 py-2 border border-primary/30 text-foreground rounded-lg hover:bg-primary/5 transition disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!documentUrl || isPending || isSubmitting}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending || isSubmitting ? t("submitting") : t("submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
