"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useUIStore } from "@/stores/useUIStore";

export function HeroSection() {
  const t = useTranslations("landing.hero");
  const tNav = useTranslations("landingNav");
  const { openRegisterModal, openLoginModal } = useUIStore();

  return (
    <section
      id="home"
      className="relative min-h-svh flex items-center justify-center px-4 py-20 overflow-hidden bg-[#0d1b2e]"
    >
      {/* Background image at natural ratio, full height, edges fade into brand color */}
      <div className="absolute inset-0 flex justify-center">
        <div
          className="relative h-full min-w-full aspect-8/5"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 18%, black 82%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 18%, black 82%, transparent)",
          }}
        >
          <Image
            src="/hockey-collection.avif"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        </div>
      </div>
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-linear-to-b from-[#0d1b2e]/70 via-[#0d1b2e]/60 to-[#0d1b2e]/85" />

      <div className="relative max-w-3xl xl:max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-6"
          >
            <span className="px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-semibold border border-primary/30">
              {t("badge")}
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
            {t("title")}{" "}
            <span className="text-primary">{t("titleHighlight")}</span>
          </h1>

          <p className="text-lg md:text-xl xl:text-2xl text-white/80 mb-10 max-w-xl xl:max-w-2xl mx-auto">
            {t("subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="group px-8 text-white"
              onClick={openRegisterModal}
            >
              {t("createProfile")}
              <ArrowRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="px-8 bg-input/30 hover:bg-input/80 text-foreground"
              onClick={openLoginModal}
            >
              {tNav("signIn")}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
