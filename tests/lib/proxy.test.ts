/**
 * What: Tests for the routing proxy (proxy.ts).
 * Why: Protected routes bounce visitors without the st-auth routing cookie to
 *      the home. The home itself now sends signed-in users (cookie present) to
 *      /opportunities before rendering, so they never see the landing flash
 *      and the persistent app shell mounts directly.
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import middleware from "@/proxy";

vi.mock("next-intl/middleware", () => ({
  default: () => () => NextResponse.next(),
}));

function request(path: string, withCookie: boolean) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: withCookie ? { cookie: "st-auth=1" } : {},
  });
}

const location = (res: Response) => {
  const value = res.headers.get("location");
  return value ? new URL(value).pathname : null;
};

describe("proxy", () => {
  it.each([
    ["/", "/opportunities"],
    ["/es", "/es/opportunities"],
    ["/fr/", "/fr/opportunities"],
  ])("sends a signed-in user from %s to %s", (path, expected) => {
    const res = middleware(request(path, true));

    expect(res.status).toBe(307);
    expect(location(res)).toBe(expected);
  });

  it("lets visitors see the home", () => {
    const res = middleware(request("/", false));

    expect(location(res)).toBeNull();
  });

  it("still bounces visitors from protected routes to the home", () => {
    const res = middleware(request("/es/opportunities", false));

    expect(location(res)).toBe("/es");
  });

  it("does not treat other routes as the home", () => {
    const res = middleware(request("/news", true));

    expect(location(res)).toBeNull();
  });
});
