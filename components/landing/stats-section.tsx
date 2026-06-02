"use client";

import { motion } from "framer-motion";
import { Users, Building2, Globe2, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function StatsSection() {
  const t = useTranslations("landing.stats");

  const stats = [
    {
      icon: Users,
      value: "Free",
      key: "players",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Building2,
      value: "Direct",
      key: "clubs",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Globe2,
      value: "Global",
      key: "countries",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Briefcase,
      value: "Vetted",
      key: "opportunities",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <section
      id="stats"
      className="py-28 px-4 bg-surface-elevated/30"
      style={{
        boxShadow:
          "0 8px 32px 0 rgba(0,0,0,0.18), 0 -8px 32px 0 rgba(0,0,0,0.18)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group hover:scale-105 transition-all duration-300 border-2 hover:border-primary/50 bg-surface-elevated">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon size={32} className={stat.color} />
                    </div>
                    <motion.p
                      initial={{ scale: 1 }}
                      whileInView={{ scale: [1, 1.1, 1] }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                      className="text-4xl md:text-5xl font-bold text-foreground mb-2"
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-lg font-semibold text-foreground mb-1">
                      {t(`items.${stat.key}.label`)}
                    </p>
                    <p className="text-sm text-foreground-muted">
                      {t(`items.${stat.key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-foreground-muted">
            <span className="font-semibold text-primary">
              {t("launchHighlight")}
            </span>{" "}
            {t("launchMessage")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
