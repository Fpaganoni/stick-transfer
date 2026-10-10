/**
 * What: Tests for FollowersFollowingModal.
 * Why: Profiles used to request the full followers/following lists just to
 *      count them (and the own profile showed 0 because `me` never asked for
 *      them). Profiles now carry only the counters, and the modal requests the
 *      list itself, only when it is opened, capped at 50 users.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { FollowersFollowingModal } from "@/components/profile/followers-following-modal";
import { GET_USER_FOLLOWERS, GET_USER_FOLLOWING } from "@/graphql";

const mockRequest = vi.fn();
vi.mock("@/lib/graphql-client", () => ({
  graphqlClient: { request: (...args: unknown[]) => mockRequest(...args) },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function renderModal(props: Partial<React.ComponentProps<typeof FollowersFollowingModal>> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FollowersFollowingModal
        isOpen={false}
        onClose={vi.fn()}
        mode="followers"
        userId="user-1"
        totalCount={2}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("FollowersFollowingModal", () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("does not request the list while closed", () => {
    renderModal();

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("requests the first 50 followers when opened and lists them", async () => {
    mockRequest.mockResolvedValue({
      followers: [
        { id: "a", name: "Ana", username: "ana", avatar: null },
        { id: "b", name: "Club Norte", username: "club_norte", avatar: "/logo.png" },
      ],
    });

    renderModal({ isOpen: true });

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Club Norte").closest("a")).toHaveAttribute(
      "href",
      "/profile/club_norte",
    );
    expect(mockRequest).toHaveBeenCalledWith(GET_USER_FOLLOWERS, {
      entityType: "USER",
      entityId: "user-1",
      limit: 50,
    });
  });

  it("requests the following list in following mode", async () => {
    mockRequest.mockResolvedValue({ following: [] });

    renderModal({ isOpen: true, mode: "following", totalCount: 0 });

    expect(await screen.findByText("followList.emptyFollowing")).toBeInTheDocument();
    expect(mockRequest).toHaveBeenCalledWith(GET_USER_FOLLOWING, {
      entityType: "USER",
      entityId: "user-1",
      limit: 50,
    });
  });

  it("shows the translated title with the total count", async () => {
    mockRequest.mockResolvedValue({ followers: [] });

    renderModal({ isOpen: true, totalCount: 120 });

    expect(screen.getByRole("heading", { name: /followers/ })).toHaveTextContent("(120)");
    expect(await screen.findByText("followList.emptyFollowers")).toBeInTheDocument();
  });

  it("shows an error message when the list cannot be loaded", async () => {
    mockRequest.mockRejectedValue(new Error("boom"));

    renderModal({ isOpen: true });

    expect(await screen.findByText("followList.error")).toBeInTheDocument();
  });
});
