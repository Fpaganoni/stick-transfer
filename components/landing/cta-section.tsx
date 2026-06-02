"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useUIStore } from "@/stores/useUIStore";

const BULLETS = ["bullet1", "bullet2", "bullet3", "bullet4"];

export function CtaSection() {
  const t = useTranslations("landing.cta");
  const { openRegisterModal } = useUIStore();

  return (
    <section id="cta" className="py-20 px-4 bg-primary">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t("title")}
          </h2>
          <p className="text-white/80 text-lg mb-10">{t("subtitle")}</p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 max-w-xl mx-auto text-left">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" />
                </div>
                <span className="text-white">
                  {t(b as Parameters<typeof t>[0])}
                </span>
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="group bg-white text-primary hover:bg-white/90 px-10"
            onClick={openRegisterModal}
          >
            {t("joinNow")}
            <ArrowRight
              size={20}
              className="ml-2 group-hover:translate-x-1 transition-transform"
            />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
