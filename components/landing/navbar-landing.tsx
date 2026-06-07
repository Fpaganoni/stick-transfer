"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HockeyXTicks } from "@/components/ui/hockey-xtick";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ThemeToggleControl } from "@/components/ui/theme-provider";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginPage } from "@/components/pages/login-page";
import { RegisterPage } from "@/components/pages/register-page";
import { useUIStore } from "@/stores/useUIStore";

export function NavbarLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    isLoginOpen,
    isRegisterOpen,
    openLoginModal,
    closeLoginModal,
    openRegisterModal,
    closeRegisterModal,
  } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("landingNav");
  const locale = useLocale();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const navLinks = [
    { href: "#home", label: t("home") },
    { href: "#roles", label: t("forYou") },
    { href: "#features", label: t("features") },
    { href: "#vacancies", label: t("vacancies") },
    { href: "#cta", label: t("joinUs") },
  ];

  // Build locale-aware landing page href
  const landingHref = locale === "en" ? "/landing" : `/${locale}/landing`;

  return (
    <header className="sticky top-0 bg-background/30 backdrop-blur-sm border-b border-border z-50 px-4 py-3">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href={landingHref} className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <HockeyXTicks size={28} className="text-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Stick Transfer
            </h1>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSelector />
          <ThemeToggleControl />

          {!mounted ? (
            <>
              <Button
                variant="ghost"
                size="default"
                className="bg-input/30 hover:bg-input/80 text-foreground"
              >
                {t("signIn")}
              </Button>
              <Button
                variant="ghost"
                size="default"
                className="text-pure-white hover:text-pure-white bg-primary/80 hover:bg-primary"
              >
                {t("signUp")}
              </Button>
            </>
          ) : (
            <>
              <Dialog
                open={isLoginOpen}
                onOpenChange={(open) =>
                  open ? openLoginModal() : closeLoginModal()
                }
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="default"
                    className="bg-input/30 hover:bg-input/80 text-foreground "
                  >
                    {t("signIn")}
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="sm:max-w-[680px] p-0 overflow-visible"
                  showCloseButton={false}
                >
                  <DialogTitle className="sr-only">Sign In</DialogTitle>
                  <LoginPage />
                </DialogContent>
              </Dialog>

              <Dialog
                open={isRegisterOpen}
                onOpenChange={(open) =>
                  open ? openRegisterModal() : closeRegisterModal()
                }
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="default"
                    className="text-pure-white hover:text-pure-white bg-primary/80 hover:bg-primary"
                  >
                    {t("signUp")}
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="max-w-md p-0 max-h-[90vh] overflow-y-auto"
                  showCloseButton={false}
                >
                  <DialogTitle className="sr-only">Sign Up</DialogTitle>
                  <RegisterPage />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
        >
          {isMenuOpen ? (
            <X size={24} className="text-foreground" />
          ) : (
            <Menu size={24} className="text-foreground" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border mt-3 pt-4 pb-4"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-foreground hover:text-primary transition-colors font-medium px-2 py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <LanguageSelector />
                <ThemeToggleControl />

                {!mounted ? (
                  <>
                    <Button
                      variant="ghost"
                      size="default"
                      className="w-full"
                    >
                      {t("signIn")}
                    </Button>
                    <Button
                      variant="default"
                      size="default"
                      className="w-full"
                    >
                      {t("signUp")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Dialog
                      open={isLoginOpen}
                      onOpenChange={(open) =>
                        open ? openLoginModal() : closeLoginModal()
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="default"
                          className="w-full"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {t("signIn")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        className="max-w-md p-0 max-h-[90vh] overflow-y-auto"
                        showCloseButton={false}
                      >
                        <DialogTitle className="sr-only">Sign In</DialogTitle>
                        <LoginPage />
                      </DialogContent>
                    </Dialog>

                    <Dialog
                      open={isRegisterOpen}
                      onOpenChange={(open) =>
                        open ? openRegisterModal() : closeRegisterModal()
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          size="default"
                          className="w-full"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {t("signUp")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        className="max-w-md p-0 max-h-[90vh] overflow-y-auto"
                        showCloseButton={false}
                      >
                        <DialogTitle className="sr-only">Sign Up</DialogTitle>
                        <RegisterPage />
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
