"use client";

import {
  FaInstagram,
  FaXTwitter,
  FaFacebook,
  FaLinkedin,
} from "react-icons/fa6";
import { HockeyXTicks } from "@/components/ui/hockey-xtick";
import { useTranslations } from "next-intl";

export function FooterLanding() {
  const currentYear = new Date().getFullYear();
  const t = useTranslations("landing.footer");

  const footerLinks = {
    product: ["features", "opportunities", "explore"],
    company: ["about", "contact", "blog"],
    legal: ["privacy", "terms", "cookies"],
  };

  const socialLinks = [
    {
      icon: FaInstagram,
      href: "https://instagram.com",
      label: "Instagram",
      color: "var(--color-instagram)",
    },
    {
      icon: FaFacebook,
      href: "https://facebook.com",
      label: "Facebook",
      color: "var(--color-facebook)",
    },
    {
      icon: FaXTwitter,
      href: "https://twitter.com",
      label: "Twitter",
      color: "var(--color-x)",
    },
    {
      icon: FaLinkedin,
      href: "https://linkedin.com",
      label: "LinkedIn",
      color: "var(--color-linkedin)",
    },
  ];

  return (
    <footer className="bg-surface-elevated border-t border-border px-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <HockeyXTicks size={32} className="text-primary" />
              <h3 className="text-xl font-bold text-foreground">
                Hockey Connect
              </h3>
            </div>
            <p className="text-foreground-muted mb-6 max-w-sm">
              {t("description")}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:scale-110 social-icon-link"
                    aria-label={social.label}
                    style={
                      { "--social-color": social.color } as React.CSSProperties
                    }
                  >
                    <Icon size={20} className="social-icon text-foreground" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">
              {t("product")}
            </h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link}`}
                    className="text-foreground-muted hover:text-primary transition-colors"
                  >
                    {t(`links.${link}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">
              {t("company")}
            </h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link}`}
                    className="text-foreground-muted hover:text-primary transition-colors"
                  >
                    {t(`links.${link}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("legal")}</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link}`}
                    className="text-foreground-muted hover:text-primary transition-colors"
                  >
                    {t(`links.${link}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <p className="text-center text-foreground-muted text-sm">
            © {currentYear} Stick Transfer. {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
