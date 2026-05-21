import { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ClubDetailPage } from "@/components/pages/club-detail-page";

interface ClubDetailRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Club | Hockey Social`,
    description: "View club details and members",
  };
}

export default async function ClubDetailRoute({
  params,
}: ClubDetailRouteProps) {
  const { id } = await params;

  return (
    <AppShell title="Club">
      <ClubDetailPage clubId={id} />
    </AppShell>
  );
}
