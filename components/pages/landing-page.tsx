"use client";

import { NavbarLanding } from "@/components/landing/navbar-landing";
import { FooterLanding } from "@/components/landing/footer-landing";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsBar } from "@/components/landing/stats-bar";
import { RoleTabsSection } from "@/components/landing/role-tabs-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { VacanciesPreviewSection } from "@/components/landing/vacancies-preview-section";
import { CtaSection } from "@/components/landing/cta-section";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <NavbarLanding />
      <main>
        <HeroSection />
        <StatsBar />
        <RoleTabsSection />
        <FeaturesSection />
        <VacanciesPreviewSection />
        <CtaSection />
      </main>
      <FooterLanding />
    </div>
  );
}
