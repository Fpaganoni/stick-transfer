import { Metadata } from "next";
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

  return <ClubDetailPage clubId={id} />;
}
