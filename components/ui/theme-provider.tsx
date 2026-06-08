"use client";

import { useEffect, useState, useCallback } from "react";
import { ThemeToggleButton, useThemeTransition } from "./toggleThemeRight";
import { sidebarMenuButtonVariants } from "./sidebar";
import { cn } from "@/lib/utils";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (!savedTheme) {
      localStorage.setItem("theme", "light");
      setTheme("light");
      document.documentElement.classList.remove("dark");
    } else {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  if (!mounted) return <>{children}</>;

  return <>{children}</>;
}

// Export component for use in header on mobile
export function useThemeControl() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { startTransition } = useThemeTransition();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    startTransition(() => {
      const newTheme = theme === "dark" ? "light" : "dark";
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);

      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    });
  }, [theme, startTransition]);

  return { theme, toggleTheme };
}

export function ThemeToggleControl() {
  const { theme, toggleTheme } = useThemeControl();

  return (
    <ThemeToggleButton
      theme={theme}
      onClick={toggleTheme}
      className={cn(sidebarMenuButtonVariants({ size: "topbar" }), "border-0")}
    />
  );
}
