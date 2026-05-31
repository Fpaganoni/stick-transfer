"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function AboutSection() {
  const t = useTranslations("landing.about");

  const benefits = ["network", "verified", "tools", "community"];

  return (
    <section id="about" className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content - Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <figure className="relative w-full h-[400px] rounded-2xl overflow-hidden bg-linear-to-br from-accent/20 to-primary/20 border-2 border-border flex items-center justify-center">
              {/* Placeholder - you can replace with actual image */}
              <Image
                src="/hockey-collection.avif"
                width={500}
                height={500}
                alt="Hockey players in a match situation"
                className="rounded-2xl"
                unoptimized
              />
            </figure>

            {/* Decorative Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute -bottom-6 -right-6 bg-primary text-white-black px-6 py-4 rounded-xl shadow-lg border-2 border-border"
            >
              <p className="text-3xl font-bold">2025</p>
              <p className="text-sm">{t("badgeMembers")}</p>
            </motion.div>
          </motion.div>

          {/* Right Content - Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-semibold border border-accent/20">
                {t("badge")}
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              {t("title")}{" "}
              <span className="text-primary">{t("titleHighlight")}</span>
            </h2>

            <p className="text-lg text-foreground-muted mb-6">
              {t("description1")}
            </p>

            <p className="text-lg text-foreground-muted mb-8">
              {t("description2")}
            </p>

            {/* Benefits List */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2
                    size={24}
                    className="text-accent shrink-0 mt-0.5"
                  />
                  <p className="text-foreground">{t(`benefits.${benefit}`)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
