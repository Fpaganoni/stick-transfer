"use client";

import { motion } from "framer-motion";
import { ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useUIStore } from "@/stores/useUIStore";

export function HeroSection() {
  const t = useTranslations("landing.hero");
  const { openRegisterModal, openLoginModal } = useUIStore();

  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0d1b2e 0%, #162544 50%, #0d1b2e 100%)" }}
    >
      {/* Subtle background image overlay */}
      <div
        className="absolute inset-0 opacity-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/hockey-stadium.jpg')" }}
      />

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
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

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {t("title")}{" "}
            <span className="text-primary">{t("titleHighlight")}</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl mx-auto lg:mx-0">
            {t("subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
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
              variant="outline"
              size="lg"
              className="px-8 border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white hover:border-white/50"
              onClick={openLoginModal}
            >
              <LogIn size={18} className="mr-2" />
              {t("login")}
            </Button>
          </div>
        </motion.div>

        {/* Right Content — Image */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <Image
              src="/hero-field-hockey-players.avif"
              alt="Hockey Network"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2e]/50 to-transparent" />
          </div>

          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
