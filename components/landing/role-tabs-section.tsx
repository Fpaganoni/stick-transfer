"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUIStore } from "@/stores/useUIStore";

const ROLES = ["players", "coaches", "clubs", "brands"];
const BULLETS = ["bullet1", "bullet2", "bullet3"];

export function RoleTabsSection() {
  const t = useTranslations("landing.roleTabs");
  const { openRegisterModal } = useUIStore();

  return (
    <section id="roles" className="py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-10 h-auto">
            {ROLES.map((role) => (
              <TabsTrigger key={role} value={role} className="py-3">
                {t(`${role}.tab` as Parameters<typeof t>[0])}
              </TabsTrigger>
            ))}
          </TabsList>

          {ROLES.map((role, i) => (
            <TabsContent key={role} value={role}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
              >
                <div>
                  <p className="text-foreground-muted text-lg mb-6 leading-relaxed">
                    {t(`${role}.description` as Parameters<typeof t>[0])}
                  </p>
                  <ul className="space-y-4 mb-8">
                    {BULLETS.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={12} className="text-primary" />
                        </div>
                        <span className="text-foreground">
                          {t(`${role}.${b}` as Parameters<typeof t>[0])}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    className="text-white"
                    onClick={openRegisterModal}
                  >
                    {t("cta")}
                  </Button>
                </div>

                <div className="hidden lg:flex items-center justify-center">
                  <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-primary/20">
                    <Image
                      src={`/${role}.webp`}
                      alt={role}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
