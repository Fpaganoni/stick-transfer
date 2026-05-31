"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useUIStore } from "@/stores/useUIStore";

export function CtaSection() {
  const t = useTranslations("landing.cta");
  const { openRegisterModal, openLoginModal } = useUIStore();

  return (
    <section
      id="cta"
      className="py-20 px-4 bg-background relative overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-accent/10 to-primary/10 -z-10" />

      {/* Decorative Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="absolute top-10 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="absolute bottom-10 right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl -z-10"
      />

      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20 mb-6">
            <Sparkles size={16} />
            <span>{t("badge")}</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("title")}
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-foreground-muted mb-10 max-w-2xl mx-auto">
            {t("description")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="group px-10 py-6 text-pure-white"
              onClick={openRegisterModal}
            >
              {t("createAccount")}
              <ArrowRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-10 py-6 hover:text-foreground"
              onClick={openLoginModal}
            >
              {t("viewProfiles")}
            </Button>
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-foreground-muted"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full" />
              <span>{t("trust1")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full" />
              <span>{t("trust2")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full" />
              <span>{t("trust3")}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
