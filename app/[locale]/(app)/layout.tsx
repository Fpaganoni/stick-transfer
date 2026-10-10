import type React from "react";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Persistent shell (sidebar + header) for the app pages. Being a layout, it
 * stays mounted across navigations inside this route group; only the page
 * below it changes. The group name does not appear in the URL.
 */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
