"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useUIStore } from "@/stores/useUIStore";

export function HeroSection() {
  const t = useTranslations("landing.hero");
  const { openRegisterModal } = useUIStore();

  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-accent/5 -z-10" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20">
              {t("badge")}
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            {t("title")}{" "}
            <span className="text-primary">{t("titleHighlight")}</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground-muted mb-8 max-w-2xl mx-auto lg:mx-0">
            {t("subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button
              size="lg"
              className="group text-pure-white px-8"
              onClick={openRegisterModal}
            >
              {t("getStarted")}
              <ArrowRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform duration-1000"
              />
            </Button>
            <Link href="/explore">
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 hover:text-foreground"
              >
                {t("explore")}
                <Play size={18} className="ml-2" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border max-w-md mx-auto lg:mx-0"
          >
            <div className="text-center lg:text-left">
              <p className="text-2xl md:text-3xl font-bold text-primary">5K+</p>
              <p className="text-sm text-foreground-muted">
                {t("statsPlayers")}
              </p>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-2xl md:text-3xl font-bold text-primary">
                200+
              </p>
              <p className="text-sm text-foreground-muted">{t("statsClubs")}</p>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-2xl md:text-3xl font-bold text-primary">30+</p>
              <p className="text-sm text-foreground-muted">
                {t("statsCountries")}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Content - Image/Illustration */}
        <div className="relative hidden lg:block">
          {/* Placeholder - you can replace with actual image */}
          <div className=" min-w-[700px] min-h-[500px] rounded-2xl flex items-center justify-center">
            <figure className="relative w-full h-[500px] rounded-2xl bg-linear-to-br from-accent/20 to-primary/20 border-2 border-border flex items-center justify-center">
              <Image
                src="/hero-field-hockey-players.avif"
                alt="Field Hockey Players"
                width={600}
                height={500}
                className="rounded-2xl"
                priority
                unoptimized
              />
            </figure>
          </div>

          {/* Decorative Elements */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3,
              repeatType: "reverse",
            }}
            className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl"
          />
          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 4,
              repeatType: "reverse",
            }}
            className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent/20 rounded-full blur-2xl"
          />
        </div>
      </div>
    </section>
  );
}
