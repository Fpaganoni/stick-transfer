import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { LandingPage } from "@/components/pages/landing-page";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/stores/useUIStore", () => ({
  useUIStore: () => ({
    openRegisterModal: vi.fn(),
    openLoginModal: vi.fn(),
    isLoginOpen: false,
    isRegisterOpen: false,
    closeLoginModal: vi.fn(),
    closeRegisterModal: vi.fn(),
  }),
}));

vi.mock("@/hooks/useJobOpportunities", () => ({
  useJobOpportunities: () => ({
    data: { jobOpportunities: [] },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/hooks/useJobApplications", () => ({
  useUserApplications: () => ({ hasAppliedTo: () => false }),
}));

vi.mock("@/stores/useOpportunitiesStore", () => ({
  useOpportunitiesStore: () => ({
    setSelectedOpportunity: vi.fn(),
    setIsModalOpen: vi.fn(),
  }),
}));

const mockMotionValue = { on: () => () => undefined, get: () => 0 };

const FRAMER_PROPS = new Set([
  "animate", "initial", "exit", "variants", "transition",
  "whileHover", "whileTap", "whileFocus", "whileInView", "whileDrag",
  "layoutId", "layout", "viewport", "custom",
  "drag", "dragConstraints", "dragElastic", "dragMomentum", "dragTransition",
  "onAnimationStart", "onAnimationComplete", "onDragStart", "onDragEnd",
  "fill", "priority",
]);

function makeMotionComponent(tag: string) {
  const MotionComponent = ({ children, ...rest }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => {
    const domProps = Object.fromEntries(
      Object.entries(rest).filter(([k]) => !FRAMER_PROPS.has(k))
    );
    return React.createElement(tag, domProps, children);
  };
  MotionComponent.displayName = `Motion.${tag}`;
  return MotionComponent;
}

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    { get: (_target, prop) => makeMotionComponent(prop as string) },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useScroll: () => ({
    scrollY: mockMotionValue,
    scrollYProgress: mockMotionValue,
    scrollX: mockMotionValue,
    scrollXProgress: mockMotionValue,
  }),
  useMotionValue: () => mockMotionValue,
  useTransform: () => mockMotionValue,
  useSpring: () => mockMotionValue,
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: ({ fill: _fill, priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/hockey-xtick", () => ({
  HockeyXTicks: () => <svg />,
}));

vi.mock("@/components/ui/language-selector", () => ({
  LanguageSelector: () => <div>Language</div>,
}));

vi.mock("@/components/ui/theme-provider", () => ({
  ThemeToggleControl: () => <button>Theme</button>,
}));

vi.mock("@/components/pages/login-page", () => ({
  LoginPage: () => <div>Login</div>,
}));

vi.mock("@/components/pages/register-page", () => ({
  RegisterPage: () => <div>Register</div>,
}));

describe("LandingPage", () => {
  it("renders without errors", () => {
    const { container } = render(<LandingPage />);
    expect(container).toBeDefined();
    expect(container.firstChild).not.toBeNull();
  });

  it("renders main landmark", () => {
    const { container } = render(<LandingPage />);
    expect(container.querySelector("main")).not.toBeNull();
  });

  it("renders header and footer", () => {
    const { container } = render(<LandingPage />);
    expect(container.querySelector("header")).not.toBeNull();
    expect(container.querySelector("footer")).not.toBeNull();
  });
});
