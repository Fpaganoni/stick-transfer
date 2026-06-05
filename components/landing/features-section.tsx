"use client";

import { motion } from "framer-motion";
import { Users, ArrowLeftRight, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

const features = [
  { key: "connect", icon: Users },
  { key: "transfer", icon: ArrowLeftRight },
  { key: "play", icon: Trophy },
];

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <section id="features" className="py-20 px-4 bg-surface-elevated">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ key, icon: Icon }, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="bg-background rounded-2xl border border-border p-8 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Icon size={28} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">
                {t(`items.${key}.title` as Parameters<typeof t>[0])}
              </h3>
              <p className="text-foreground-muted leading-relaxed text-sm">
                {t(`items.${key}.description` as Parameters<typeof t>[0])}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
