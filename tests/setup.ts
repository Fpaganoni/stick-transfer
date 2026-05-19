import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";
import React, { createContext, useContext } from "react";

// ── next/navigation ──────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/en/opportunities",
  useSearchParams: () => new URLSearchParams(),
}));

// ── next-intl ────────────────────────────────────────────────────────────────
// Contexto interno que simula el provider de next-intl
type IntlCtx = { messages: Record<string, unknown>; locale: string };
const IntlContext = createContext<IntlCtx | null>(null);

/**
 * Mock de NextIntlClientProvider: envuelve children con el contexto de
 * mensajes para que useTranslations pueda resolver las claves reales.
 */
const MockNextIntlClientProvider = ({
  children,
  messages,
  locale,
}: {
  children: React.ReactNode;
  messages: Record<string, unknown>;
  locale: string;
}) =>
  React.createElement(
    IntlContext.Provider,
    { value: { messages, locale } },
    children,
  );

/**
 * Mock de useTranslations: intenta resolver la clave en los messages del
 * contexto (si hay un Provider activo). Si no hay contexto, devuelve la clave
 * literal — mismo comportamiento que usaban los tests anteriores.
 */
const mockUseTranslations = (namespace?: string) => {
  const context = useContext(IntlContext);
  return (key: string) => {
    if (!context?.messages) return key;
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const parts = fullKey.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = context.messages;
    for (const part of parts) {
      if (val && typeof val === "object") {
        val = val[part];
      } else {
        return key;
      }
    }
    return val !== undefined ? String(val) : key;
  };
};

vi.mock("next-intl", () => ({
  NextIntlClientProvider: MockNextIntlClientProvider,
  useTranslations: mockUseTranslations,
}));

// ── localStorage (zustand persist) ───────────────────────────────────────────
beforeEach(() => {
  localStorage.clear();
});
